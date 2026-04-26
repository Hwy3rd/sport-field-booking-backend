import {
  BOOKING_STATUS,
  BOOKING_STATUS_VALUES,
  type BookingStatus,
} from 'src/libs/constants/booking.constant';
import { User } from 'src/modules/user/entities/user.entity';
import { BookingItem } from './booking-item.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_bookings_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => BookingItem, (item) => item.booking)
  items!: BookingItem[];

  @Column({ name: 'total_price', type: 'integer' })
  totalPrice!: number;

  @Column({
    type: 'enum',
    enum: BOOKING_STATUS_VALUES,
    default: BOOKING_STATUS.PENDING,
  })
  status!: BookingStatus;

  @Column({ default: false })
  isDeleted!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
