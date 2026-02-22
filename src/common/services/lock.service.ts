import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lock, LockPreference } from '../../lock/entities/lock.entity';

@Injectable()
export class LockService {
  constructor(
    @InjectRepository(Lock)
    private readonly lockRepository: Repository<Lock>,
  ) {}

  async findByUserId(userId: number): Promise<Lock | null> {
    return this.lockRepository.findOne({
      where: { userId }
    });
  }

  async createDefaultLock(userId: number): Promise<void> {
    // Check if lock record already exists
    const existingLock = await this.findByUserId(userId);
    
    if (!existingLock) {
      // Only create if it doesn't exist
      await this.lockRepository.save({
        userId,
        preferences: LockPreference.OFF, // Default to OFF
        lastActive: new Date(),
      });
    }
  }

  async updateLastActive(lockId: number): Promise<void> {
    await this.lockRepository.save({
      id: lockId,
      lastActive: new Date(),
    });
  }

  async setLastActiveToNull(userId: number): Promise<void> {
    await this.lockRepository.query(
      'UPDATE locks SET last_active = NULL WHERE user_id = $1',
      [userId]
    );
  }

  getThreshold(preference: LockPreference): number {
    switch (preference) {
      case LockPreference.ONE_MIN:
        return 1 * 60 * 1000; // 1 minute
      case LockPreference.FIVE_MIN:
        return 5 * 60 * 1000; // 5 minutes
      case LockPreference.TEN_MIN:
        return 10 * 60 * 1000; // 10 minutes
      case LockPreference.THIRTY_MIN:
        return 30 * 60 * 1000; // 30 minutes
      default:
        return 0;
    }
  }
}
