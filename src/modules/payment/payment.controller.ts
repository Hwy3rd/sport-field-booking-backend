import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { GetUserId } from 'src/common/decorators/get-user-id.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreatePaymentUrlDto } from './dto/create-payment-url.dto';
import { PaymentService } from './payment.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-url')
  @ApiOperation({ summary: 'Create VNPay checkout URL' })
  @ApiOkResponse({ description: 'Checkout payment URL successfully created.' })
  async createUrl(
    @Req() req: Request,
    @GetUserId() userId: string,
    @Body() body: CreatePaymentUrlDto,
  ) {
    // Lấy IP của người dùng
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const paymentUrl = await this.paymentService.createPaymentUrl(
      body,
      ipAddr,
      userId,
    );

    return {
      message: 'Tạo URL thanh toán thành công',
      paymentUrl,
    };
  }

  @Get('vnpay-return')
  @ApiOperation({ summary: 'VNPay return URL handler' })
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    const verifyResult = await this.paymentService.verifyReturnUrl(query);
    const clientUrl =
      this.configService.get<string>('CLIENT_URL') || 'http://localhost:3000';

    // Lấy chi tiết giao dịch để lấy bookingId thật của database
    const txnRef = query.vnp_TxnRef;
    const payment = await this.paymentService.getPaymentByTxnRef(txnRef);
    const bookingId = payment ? payment.bookingId : 'unknown';

    if (verifyResult.isSuccess) {
      // Tự động đồng bộ trạng thái giao dịch vào CSDL ngay lập tức tại đây
      // Giúp UX người dùng siêu tốc, chạy được trên cả localhost lẫn môi trường tunnel/cloud
      await this.paymentService.processPaymentStatusUpdate(query);

      // Redirect về trang chủ với query params thông báo thành công
      return res.redirect(
        `${clientUrl}/?payment_status=success&bookingId=${bookingId}`,
      );
    } else {
      // Redirect về trang chủ với query params thông báo thất bại
      return res.redirect(
        `${clientUrl}/?payment_status=failed&bookingId=${bookingId}`,
      );
    }
  }

  @Get('vnpay-ipn')
  @ApiOperation({ summary: 'VNPay IPN endpoint (Server-to-Server webhook)' })
  async vnpayIpn(@Query() query: any) {
    return await this.paymentService.verifyIpnCall(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('booking/:bookingId/refund')
  @ApiOperation({ summary: 'Refund a booking' })
  async refundBooking(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
  ) {
    let ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    // Xử lý IPv6 local để tuân thủ chuẩn IPv4 khắt khe của VNPay
    if (ipAddr === '::1' || ipAddr.includes('::ffff:')) {
      ipAddr = '127.0.0.1';
    }

    return await this.paymentService.refundBooking(
      req.user,
      bookingId,
      ipAddr,
    );
  }
}
