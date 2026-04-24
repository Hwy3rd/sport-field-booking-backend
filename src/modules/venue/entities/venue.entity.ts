import {
  VENUE_STATUS,
  VENUE_STATUS_VALUES,
  type VenueStatus,
} from 'src/libs/constants/venue.constant';
import { User } from 'src/modules/user/entities/user.entity';
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

type VenueOperatingHours = {
  start_time: string;
  end_time: string;
};

type VenueContactInfo = {
  phone: string;
  email: string;
};

@Entity('venues')
@Index('UQ_venues_owner_name_active', ['ownerId', 'name'], {
  unique: true,
  where: `"status" != '${VENUE_STATUS.DELETED}'`,
})
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_venues_owner_id')
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner!: User;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  address!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'jsonb' })
  operating_hours!: VenueOperatingHours;

  @Column({ type: 'jsonb' })
  contact_info!: VenueContactInfo;

  @Column({
    type: 'enum',
    enum: VENUE_STATUS_VALUES,
    default: VENUE_STATUS.ACTIVE,
  })
  status!: VenueStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
