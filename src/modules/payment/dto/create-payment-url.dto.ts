import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreatePaymentUrlDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId!: string;
}
