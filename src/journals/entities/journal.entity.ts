import { User } from '../../users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, } from 'typeorm';
import { JournalMedia } from './journal-media.entity';

@Entity('journals')
export class Journal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_id: string;
    
    @Column({ type: 'text', nullable: true })
    title: string | null;

    @Column({ type: 'text', nullable: true })
    content: string | null;

    @Column({ type: 'date' })
    journal_date: Date;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any> | null;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => JournalMedia, (media) => media.journal)
    media: JournalMedia[];
}
