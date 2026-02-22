import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { UserProfile } from '../../profiles/entities/user-profile.entity';
import { Lock } from '../../lock/entities/lock.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({ type: 'text', name: 'password_hash', nullable: false })
  passwordHash: string;

  @Column({ 
    name: 'is_email_verified',
    type: 'boolean',
    default: false 
  })
  isEmailVerified: boolean;

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
  @OneToOne(() => UserProfile, profile => profile.user)
  profile: UserProfile;

  @OneToMany(() => Lock, lock => lock.user)
  locks: Lock[];
}