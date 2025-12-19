import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('otps')
export class OTP {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 6, nullable: false })
  otp: string;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: false })
  expiresAt: Date;

  @CreateDateColumn({ 
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'NOW()' 
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    name: 'updated_at',
    type: 'timestamp with time zone',
    default: () => 'NOW()',
    onUpdate: 'NOW()'
  })
  updatedAt: Date;
}