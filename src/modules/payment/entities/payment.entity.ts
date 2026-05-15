import { Booking } from 'src/modules/booking/entities/booking.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  PAYMENT_METHOD,
  PAYMENT_METHOD_VALUES,
  PAYMENT_STATUS,
  PAYMENT_STATUS_VALUES,
  type PaymentMethod,
  type PaymentStatus,
} from 'src/libs/constants/payment.constant';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ name: 'amount', type: 'integer' })
  amount!: number;

  @Column({
    type: 'enum',
    enum: PAYMENT_METHOD_VALUES,
    default: PAYMENT_METHOD.VNPAY,
  })
  method!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PAYMENT_STATUS_VALUES,
    default: PAYMENT_STATUS.PENDING,
  })
  status!: PaymentStatus;

  @Column({ name: 'txn_ref', unique: true })
  txnRef!: string; // Reference to map with VNPAY

  @Column({ name: 'transaction_no', nullable: true })
  transactionNo?: string; // VNPAY transaction number

  @Column({ name: 'bank_code', nullable: true })
  bankCode?: string;

  @Column({ name: 'pay_date', nullable: true, type: 'timestamptz' })
  payDate?: Date;

  @Column({ name: 'payment_info', type: 'text', nullable: true })
  paymentInfo?: string;

  @Column({ name: 'refunded_amount', type: 'integer', default: 0 })
  refundedAmount!: number;

  @Column({ name: 'refund_info', type: 'text', nullable: true })
  refundInfo?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
