import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, Index, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_streaks')
@Index('idx_user_streaks_user_id', ['user'])
@Unique(['user'])
export class UserStreak {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'current_streak', type: 'integer', default: 0 })
  currentStreak: number;

  @Column({ name: 'longest_streak', type: 'integer', default: 0 })
  longestStreak: number;

  @Column({ name: 'last_activity_date', type: 'date', nullable: true })
  lastActivityDate: Date | null;

  @Column({ name: 'freeze_count', type: 'integer', default: 0 })
  freezeCount: number;

  @Column({ name: 'frozen_date', type: 'date', nullable: true })
  frozenDate: Date | null;

  @Column({ name: 'last_freeze_milestone', type: 'integer', default: 0 })
  lastFreezeMilestone: number;

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
