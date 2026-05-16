import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { VnpayService } from 'nestjs-vnpay';
import { BOOKING_STATUS } from 'src/libs/constants/booking.constant';
import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from 'src/libs/constants/payment.constant';
import { BookingService } from 'src/modules/booking/booking.service';
import { Booking } from 'src/modules/booking/entities/booking.entity';
import { DataSource, Repository } from 'typeorm';
import { ProductCode, VnpLocale, RefundTransactionType } from 'vnpay';
import { CreatePaymentUrlDto } from './dto/create-payment-url.dto';
import { Payment } from './entities/payment.entity';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly vnpayService: VnpayService,
    private readonly configService: ConfigService,
    private readonly bookingService: BookingService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly dataSource: DataSource,
  ) {}

  async createPaymentUrl(
    dto: CreatePaymentUrlDto,
    ipAddr: string,
    userId: string,
  ) {
    const booking = await this.bookingService.findOne(
      { id: userId },
      dto.bookingId,
    );

    if (booking.status !== BOOKING_STATUS.PENDING) {
      throw new BadRequestException(
        `Booking is already ${booking.status}. Cannot pay again.`,
      );
    }

    const txnRef = 'BOOKING_' + Date.now();

    const clientUrl =
      this.configService.get<string>('CLIENT_URL') || 'http://localhost:3000';

    // Save initial Payment Record
    const payment = this.paymentRepository.create({
      bookingId: booking.id,
      amount: booking.totalPrice,
      method: PAYMENT_METHOD.VNPAY,
      status: PAYMENT_STATUS.PENDING,
      txnRef,
    });
    await this.paymentRepository.save(payment);

    const now = dayjs();
    const expirationTime = dayjs(booking.createdAt).add(15, 'minute');

    if (expirationTime.isBefore(now)) {
      throw new BadRequestException(
        'Thời gian thanh toán cho đơn hàng này đã hết hạn.',
      );
    }

    const serverUrl =
      this.configService.get<string>('SERVER_URL') || 'http://localhost:3100';

    const urlString = await this.vnpayService.buildPaymentUrl({
      vnp_Amount: booking.totalPrice,
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan dat san - ${booking.id}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: `${serverUrl}/api/payment/vnpay-return`, // Backend route handler
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: Number(
        dayjs().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss'),
      ),
      vnp_ExpireDate: Number(
        expirationTime.tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss'),
      ),
    });

    return urlString;
  }

  async verifyReturnUrl(query: any) {
    if (!query || Object.keys(query).length === 0 || !query.vnp_TxnRef) {
      this.logger.warn('Received invalid/empty Return request.');
      return {
        isSuccess: false,
        message: 'Tham số yêu cầu không hợp lệ',
      };
    }

    try {
      const verifyResult = await this.vnpayService.verifyReturnUrl(query);
      this.logger.log('VNPay VerifyReturnUrl Result:', verifyResult);
      return verifyResult;
    } catch (error) {
      this.logger.error('VNPay VerifyReturnUrl Error:', error);
      return {
        isSuccess: false,
        message: 'Chữ ký thanh toán không hợp lệ',
      };
    }
  }

  async getPaymentByTxnRef(txnRef: string) {
    this.logger.log('Payment Ref: ', txnRef);
    if (!txnRef) {
      return null;
    }
    return this.paymentRepository.findOne({
      where: { txnRef },
    });
  }

  async verifyIpnCall(query: any) {
    this.logger.log('Starting IPN verification process...', query);

    if (!query || Object.keys(query).length === 0 || !query.vnp_TxnRef) {
      this.logger.warn('Received invalid/empty IPN request. Ignoring.');
      return { RspCode: '99', Message: 'Invalid request parameters' };
    }

    try {
      const verifyResult = await this.vnpayService.verifyIpnCall(query);

      if (!verifyResult.isSuccess) {
        this.logger.warn('IPN checksum failed verification.', query);
        return { RspCode: '97', Message: 'Checksum failed' };
      }

      return await this.processPaymentStatusUpdate(query);
    } catch (error) {
      this.logger.error('IPN Error:', error);
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }

  async processPaymentStatusUpdate(query: any) {
    this.logger.log(
      'Executing processPaymentStatusUpdate for TxnRef:',
      query.vnp_TxnRef,
    );
    const txnRef = query.vnp_TxnRef;
    const vnp_ResponseCode = query.vnp_ResponseCode;
    const amount = Number(query.vnp_Amount) / 100;

    const payment = await this.paymentRepository.findOne({
      where: { txnRef },
    });

    if (!payment) {
      this.logger.warn(
        `ProcessPayment Error: Order with TxnRef ${txnRef} not found in DB.`,
      );
      return { RspCode: '01', Message: 'Order not found' };
    }
    if (payment.amount !== amount) {
      this.logger.warn(
        `ProcessPayment Error: Amount mismatch. Request: ${amount}, DB: ${payment.amount}`,
      );
      return { RspCode: '04', Message: 'Invalid amount' };
    }
    if (payment.status !== PAYMENT_STATUS.PENDING) {
      this.logger.warn(
        `ProcessPayment Info: Order status is ${payment.status}, skipping duplicate update. TxnRef: ${txnRef}`,
      );
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // Khởi tạo Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (vnp_ResponseCode === '00') {
        payment.status = PAYMENT_STATUS.COMPLETED;
        payment.transactionNo = query.vnp_TransactionNo;
        payment.bankCode = query.vnp_BankCode;

        // Parse timezone chuẩn Việt Nam
        const payDateStr = query.vnp_PayDate;
        if (payDateStr && payDateStr.length === 14) {
          payment.payDate = dayjs
            .tz(payDateStr, 'YYYYMMDDHHmmss', 'Asia/Ho_Chi_Minh')
            .toDate();
        }
        payment.paymentInfo = JSON.stringify(query);

        // 1. Lưu Payment bằng QueryRunner
        await queryRunner.manager.save(Payment, payment);

        // 2. Cập nhật Booking bằng QueryRunner (Đảm bảo cùng 1 transaction)
        await queryRunner.manager.update(Booking, payment.bookingId, {
          status: BOOKING_STATUS.CONFIRMED,
        });
      } else {
        // Giao dịch thất bại
        payment.status = PAYMENT_STATUS.FAILED;
        payment.paymentInfo = JSON.stringify(query);
        await queryRunner.manager.save(Payment, payment);
      }

      // Nếu mọi thứ chạy mượt mà, Commit Transaction
      await queryRunner.commitTransaction();
      this.logger.log(
        `Payment successfully committed to DB for TxnRef ${txnRef}. ResponseCode: ${vnp_ResponseCode}`,
      );

      return { RspCode: '00', Message: 'Confirm Success' };
    } catch (err) {
      // Có lỗi xảy ra (ví dụ DB sập, timeout), Rollback toàn bộ dữ liệu
      await queryRunner.rollbackTransaction();
      this.logger.error('Error executing Payment SQL transaction:', err);
      return { RspCode: '99', Message: 'Unknown error during transaction' };
    } finally {
      // Phải luôn giải phóng QueryRunner
      await queryRunner.release();
    }
  }

  async refundBooking(
    userId: string,
    bookingId: string,
    ipAddr: string,
    userName: string,
  ) {
    const booking = await this.bookingService.findOne(
      { id: userId },
      bookingId,
    );

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new BadRequestException(
        'Chỉ cho phép hoàn tiền đối với các đơn hàng đang ở trạng thái Đã xác nhận (CONFIRMED).',
      );
    }

    // 1. Ràng buộc thời gian: Trước giờ chơi 24 tiếng
    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    let minPlayTime: dayjs.Dayjs | null = null;

    if (!booking.items || booking.items.length === 0) {
      throw new BadRequestException(
        'Đơn hàng không chứa thông tin chi tiết khung giờ.',
      );
    }

    for (const item of booking.items) {
      const dateStr = dayjs(item.slotDate).format('YYYY-MM-DD');
      const playTime = dayjs.tz(
        `${dateStr}T${item.startTime}`,
        'Asia/Ho_Chi_Minh',
      );
      if (!minPlayTime || playTime.isBefore(minPlayTime)) {
        minPlayTime = playTime;
      }
    }

    if (minPlayTime) {
      const diffHours = minPlayTime.diff(now, 'hour', true);
      if (diffHours < 24) {
        throw new BadRequestException(
          `Chỉ cho phép hoàn tiền trước giờ chơi tối thiểu 24 tiếng. Trận đấu sớm nhất của bạn bắt đầu vào ${minPlayTime.format('DD/MM/YYYY HH:mm')}.`,
        );
      }
    }

    // 2. Tìm giao dịch thanh toán VNPay gốc thành công
    const payment = await this.paymentRepository.findOne({
      where: {
        bookingId: booking.id,
        status: PAYMENT_STATUS.COMPLETED,
        method: PAYMENT_METHOD.VNPAY,
      },
    });

    if (!payment) {
      throw new NotFoundException(
        'Không tìm thấy bản ghi giao dịch VNPay thành công tương ứng cho đơn đặt sân này.',
      );
    }

    // 3. Chuẩn bị Payload API VNPay Refund
    // vnp_RequestId: alphanumeric thuần, tối đa 30 ký tự. Không được chứa dấu gạch dưới hoặc khoảng trắng.
    const vnp_RequestId = `REQ${dayjs().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss')}${Math.floor(10 + Math.random() * 89)}`;

    // Sử dụng định dạng String cho các tham số ngày tháng và TransactionNo để tránh lỗi định dạng JSON Number trong VNPay 2.1.0
    const vnp_TransactionDate = dayjs(payment.payDate!)
      .tz('Asia/Ho_Chi_Minh')
      .format('YYYYMMDDHHmmss');

    const vnp_CreateDate = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss');

    // Fix vnp_IpAddr: Lấy IP đầu tiên nếu là chuỗi nhiều IP (do qua Proxy) và xử lý format IPv6
    let safeIp = ipAddr || '127.0.0.1';
    if (safeIp.includes(',')) {
      safeIp = safeIp.split(',')[0].trim();
    }
    if (safeIp.includes('::ffff:')) {
      safeIp = safeIp.replace('::ffff:', '');
    }
    if (safeIp === '::1') {
      safeIp = '127.0.0.1';
    }
    // Đảm bảo không quá dài (VNPay Refund API 2.1.0 thường yêu cầu IPv4 15 chars)
    if (safeIp.length > 15 && safeIp.includes('.')) {
      safeIp = safeIp.substring(0, 15);
    }

    // Đảm bảo vnp_CreateBy là ký tự ASCII thường, không khoảng trắng để tránh lỗi VNPay Validator
    const safeCreator = `User${(userName || userId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)}`;

    // Đảm bảo vnp_TransactionNo là string
    const vnp_TransactionNo = String(payment.transactionNo || '0');

    const refundPayload = {
      vnp_RequestId,
      vnp_TransactionDate: vnp_TransactionDate as any,
      vnp_IpAddr: safeIp,
      vnp_TxnRef: payment.txnRef,
      vnp_Amount: payment.amount,
      vnp_OrderInfo: `Hoan tra booking ${booking.id.substring(0, 8)}`,
      vnp_TransactionType: RefundTransactionType.FULL_REFUND,
      vnp_CreateBy: safeCreator,
      vnp_CreateDate: vnp_CreateDate as any,
      vnp_TransactionNo: vnp_TransactionNo as any,
    };

    this.logger.log('VNPay Refund Payload to Lib:', JSON.stringify(refundPayload));

    try {
      const refundResponse = await this.vnpayService.refund(refundPayload);

      this.logger.log('VNPay Refund raw response:', JSON.stringify(refundResponse));

      if (
        refundResponse.isSuccess &&
        refundResponse.vnp_ResponseCode === '00'
      ) {
        // Cập nhật kế toán giao dịch
        payment.status = PAYMENT_STATUS.REFUNDED;
        payment.refundedAmount = payment.amount;
        payment.refundInfo = `Hoàn tiền thành công. RequestID: ${vnp_RequestId}. Msg: ${refundResponse.vnp_Message}`;
        await this.paymentRepository.save(payment);

        // Cập nhật trạng thái booking thành CANCELLED -> Hệ thống sẽ tự động nhả sân (TimeSlots)
        await this.bookingService.update(booking.id, {
          status: BOOKING_STATUS.CANCELLED,
        });

        return {
          success: true,
          message: 'Hoàn trả tiền qua VNPay và Hủy đơn đặt sân thành công.',
          vnp_ResponseCode: refundResponse.vnp_ResponseCode,
        };
      } else {
        throw new BadRequestException(
          `Cổng VNPay từ chối hoàn trả. Mã lỗi: ${refundResponse.vnp_ResponseCode}. Nội dung: ${refundResponse.message || refundResponse.vnp_Message}`,
        );
      }
    } catch (error) {
      this.logger.error('CRITICAL ERROR DURING VNPAY REFUND API:', error);
      throw error;
    }
  }
}
