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
import { ProductCode, VnpLocale } from 'vnpay';
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
    const booking = await this.bookingService.findOne(userId, dto.bookingId);

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
}
