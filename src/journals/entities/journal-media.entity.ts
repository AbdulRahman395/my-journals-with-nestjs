import { Journal } from './journal.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('journal_media')
export class JournalMedia {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'int' })
  journal_id: number;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Journal, (journal) => journal.media, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'journal_id' })
  journal: Journal;
}
