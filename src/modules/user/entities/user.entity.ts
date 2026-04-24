import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  USER_STATUS,
  USER_STATUS_VALUES,
  USER_ROLE,
  USER_ROLE_VALUES,
  type UserStatus,
  type UserRole,
} from 'src/libs/constants/user.constant';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_users_username', {
    unique: true,
    where: `"status" != '${USER_STATUS.DELETED}'`,
  })
  @Column({ type: 'varchar', length: 255 })
  username!: string;

  @Column({ type: 'text' })
  password!: string;

  @Index('IDX_users_email', {
    unique: true,
    where: `"status" != '${USER_STATUS.DELETED}'`,
  })
  @Column({ type: 'varchar', length: 255 })
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
