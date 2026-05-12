import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VnpayModule } from 'nestjs-vnpay';
import { HashAlgorithm, ignoreLogger } from 'vnpay';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import type { VnpayModuleOptions } from 'nestjs-vnpay';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { BookingModule } from 'src/modules/booking/booking.module';

@Module({
  imports: [
    VnpayModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
      ): Promise<VnpayModuleOptions> => ({
        tmnCode: configService.getOrThrow<string>('VNPAY_TMN_CODE'),
        secureSecret: configService.getOrThrow<string>('VNPAY_SECURE_SECRET'),
        vnpayHost: 'https://sandbox.vnpayment.vn',
        testMode: true,
        hashAlgorithm: HashAlgorithm.SHA512,
        enableLog: true,
        loggerFn: ignoreLogger,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Payment]),
    BookingModule,
  ],
  providers: [PaymentService, ConfigService],
  controllers: [PaymentController],
})
export class PaymentModule {}
