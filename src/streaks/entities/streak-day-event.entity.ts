import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type StreakDayEventType = 'active' | 'frozen';

@Entity('streak_day_events')
@Index('idx_streak_day_events_user_date', ['user', 'eventDate'])
@Unique('uq_streak_day_events_user_date', ['user', 'eventDate'])
export class StreakDayEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'event_date', type: 'date' })
  eventDate: Date;

  @Column({ name: 'event_type', type: 'varchar', length: 10 })
  eventType: StreakDayEventType;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'NOW()',
  })
  createdAt: Date;
}
