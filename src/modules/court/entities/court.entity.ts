import {
  COURT_STATUS,
  COURT_STATUS_VALUES,
  type CourtStatus,
} from 'src/libs/constants/court.constant';
import { Sport } from 'src/modules/sport/entities/sport.entity';
import { Venue } from 'src/modules/venue/entities/venue.entity';
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

@Entity('courts')
@Index('UQ_courts_venue_name_active', ['venueId', 'name'], {
  unique: true,
  where: `"status" != '${COURT_STATUS.DELETED}'`,
})
export class Court {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_courts_venue_id')
  @Column({ name: 'venue_id', type: 'uuid' })
  venueId!: string;

  @ManyToOne(() => Venue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venue_id' })
  venue!: Venue;

  @Index('IDX_courts_sport_id')
  @Column({ name: 'sport_id', type: 'uuid' })
  sportId!: string;

  @ManyToOne(() => Sport)
  @JoinColumn({ name: 'sport_id' })
  sport!: Sport;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'price_per_hour', type: 'integer' })
  pricePerHour!: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({
    type: 'enum',
    enum: COURT_STATUS_VALUES,
    default: COURT_STATUS.ACTIVE,
  })
  status!: CourtStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
