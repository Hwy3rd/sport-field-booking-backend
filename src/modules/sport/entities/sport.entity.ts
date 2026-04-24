import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sports')
@Index('UQ_sports_name_active', ['name'], {
  unique: true,
  where: `"isDeleted" = false`,
})
export class Sport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ default: false })
  isDeleted!: boolean;
}
