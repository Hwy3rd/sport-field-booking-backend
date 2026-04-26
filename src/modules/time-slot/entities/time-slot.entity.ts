import { Court } from 'src/modules/court/entities/court.entity';
import {
  TIME_SLOT_STATUS,
  TIME_SLOT_STATUS_VALUES,
  type TimeSlotStatus,
} from 'src/libs/constants/time-slot.constant';
import { TimeSlotTemplate } from './time-slot-template.entity';
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

@Entity('time_slots')
@Index('UQ_time_slots_unique', ['courtId', 'date', 'startTime', 'endTime'], {
  unique: true,
})
export class TimeSlot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_time_slots_court_id')
  @Column({ name: 'court_id', type: 'uuid' })
  courtId!: string;

  @ManyToOne(() => Court, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'court_id' })
  court!: Court;

  @Index('IDX_time_slots_template_id')
  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId?: string | null;

  @ManyToOne(() => TimeSlotTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'template_id' })
  template?: TimeSlotTemplate | null;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ type: 'integer' })
  price!: number;

  @Column({
    type: 'enum',
    enum: TIME_SLOT_STATUS_VALUES,
    default: TIME_SLOT_STATUS.AVAILABLE,
  })
  status!: TimeSlotStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
