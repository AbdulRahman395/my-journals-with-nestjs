import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { UserProfile } from '../../profiles/entities/user-profile.entity';
import { Lock } from '../../lock/entities/lock.entity';
import { Journal } from '../../journals/entities/journal.entity';
import { OTP } from './otp.entity';
import { Pin } from '../../pin/entities/pin.entity';
import { UserStreak } from '../../streaks/entities/user-streak.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email!: string;

  @Column({ type: 'text', name: 'password_hash', nullable: false })
  passwordHash!: string;

  @Column({
    name: 'is_email_verified',
    type: 'boolean',
    default: false
  })
  isEmailVerified!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'NOW()'
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    default: () => 'NOW()',
    onUpdate: 'NOW()'
  })
  updatedAt!: Date;

  // Relations
  @OneToOne(() => UserProfile, profile => profile.user, { cascade: true, onDelete: 'CASCADE' })
  profile!: UserProfile;

  @OneToMany(() => Journal, journal => journal.user, { cascade: true, onDelete: 'CASCADE' })
  journals!: Journal[];

  @OneToMany(() => Lock, lock => lock.user, { cascade: true, onDelete: 'CASCADE' })
  locks!: Lock[];

  @OneToMany(() => OTP, otp => otp.user, { cascade: true, onDelete: 'CASCADE' })
  otps!: OTP[];

  @OneToMany(() => Pin, pin => pin.user, { cascade: true, onDelete: 'CASCADE' })
  pins!: Pin[];

  @OneToOne(() => UserStreak, streak => streak.user, { cascade: true, onDelete: 'CASCADE' })
  streak!: UserStreak;
}