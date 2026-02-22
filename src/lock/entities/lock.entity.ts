import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum LockPreference {
  IMMEDIATELY = 'immediately',
  ONE_MIN = '1 min',
  FIVE_MIN = '5 min',
  TEN_MIN = '10 min',
  THIRTY_MIN = '30 min',
  OFF = 'off'
}

@Entity('locks')
export class Lock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'user_id', nullable: false, unique: true })
  userId: number;

  @Column({
    type: 'enum',
    enum: LockPreference,
    default: LockPreference.IMMEDIATELY,
    nullable: false
  })
  preferences: LockPreference;

  @Column({ 
    type: 'timestamp with time zone',
    name: 'last_active',
    nullable: true 
  })
  lastActive: Date;

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

  // Relations
  @ManyToOne(() => User, user => user.locks)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
