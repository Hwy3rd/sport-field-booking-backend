import type { UserRole, UserStatus } from 'src/libs/constants/user.constant';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  USER_ROLE_VALUES,
  USER_STATUS_VALUES,
  USER_ROLE,
  USER_STATUS,
} from 'src/libs/constants/user.constant';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  username!: string;

  @Column({ type: 'text' })
  password!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string | null;

  @Column({ type: 'enum', enum: USER_ROLE_VALUES, default: USER_ROLE.USER })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: USER_STATUS_VALUES,
    default: USER_STATUS.ACTIVE,
  })
  status!: UserStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
