import {
  TIME_SLOT_WEEKDAY_VALUES,
  type TimeSlotWeekday,
} from 'src/libs/constants/time-slot.constant';
import { Court } from 'src/modules/court/entities/court.entity';
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

@Entity('time_slot_templates')
@Index(
  'UQ_time_slot_templates_court_weekday_time',
  ['courtId', 'weekday', 'startTime', 'endTime'],
  { unique: true },
)
export class TimeSlotTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_time_slot_templates_court_id')
  @Column({ name: 'court_id', type: 'uuid' })
  courtId!: string;

  @ManyToOne(() => Court, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'court_id' })
  court!: Court;

  @Column({
    type: 'smallint',
    comment: `1-7 mapped by TIME_SLOT_WEEKDAY: ${TIME_SLOT_WEEKDAY_VALUES.join(',')}`,
  })
  weekday!: TimeSlotWeekday;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ type: 'integer' })
  price!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
