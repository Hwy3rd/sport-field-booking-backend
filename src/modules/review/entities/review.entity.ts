import { User } from 'src/modules/user/entities/user.entity';
import { Venue } from 'src/modules/venue/entities/venue.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reviews')
@Index('UQ_reviews_user_venue', ['userId', 'venueId'], { unique: true })
@Check(`"rating" BETWEEN 1 AND 5`)
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_reviews_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index('IDX_reviews_venue_id')
  @Column({ name: 'venue_id', type: 'uuid' })
  venueId!: string;

  @ManyToOne(() => Venue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venue_id' })
  venue!: Venue;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @Column({ type: 'int' })
  rating!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
