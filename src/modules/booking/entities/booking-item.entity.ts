import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { TimeSlot } from 'src/modules/time-slot/entities/time-slot.entity';

@Entity('booking_items')
export class BookingItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_booking_items_booking_id')
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Index('IDX_booking_items_time_slot_id')
  @Column({ name: 'time_slot_id', type: 'uuid', nullable: true })
  timeSlotId!: string | null;

  @ManyToOne(() => TimeSlot, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'time_slot_id' })
  timeSlot!: TimeSlot | null;

  @Index('IDX_booking_items_court_id')
  @Column({ name: 'court_id', type: 'uuid' })
  courtId!: string;

  @Column({ name: 'slot_date', type: 'date' })
  slotDate!: Date;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ name: 'unit_price', type: 'integer' })
  unitPrice!: number;

  @Column({ name: 'total_price', type: 'integer' })
  totalPrice!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
