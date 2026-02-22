import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lock, LockPreference } from './entities/lock.entity';
import { UpdateLockPreferenceDto } from './dto/update-lock-preference.dto';

@Injectable()
export class LockService {
  constructor(
    @InjectRepository(Lock)
    private readonly lockRepository: Repository<Lock>,
  ) {}

  async findByUserId(userId: number): Promise<Lock> {
    const lock = await this.lockRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!lock) {
      // Create a default lock entry if none exists
      return this.createDefaultLock(userId);
    }

    return lock;
  }

  async updateLockPreference(userId: number, updateLockPreferenceDto: UpdateLockPreferenceDto): Promise<Lock> {
    const lock = await this.findByUserId(userId);

    lock.preferences = updateLockPreferenceDto.preferences;
    
    if (updateLockPreferenceDto.lastActive) {
      lock.lastActive = updateLockPreferenceDto.lastActive;
    }

    return this.lockRepository.save(lock);
  }

  async updateLastActive(userId: number): Promise<Lock> {
    const lock = await this.findByUserId(userId);
    lock.lastActive = new Date();
    return this.lockRepository.save(lock);
  }

  private async createDefaultLock(userId: number): Promise<Lock> {
    const lock = this.lockRepository.create({
      userId,
      preferences: LockPreference.IMMEDIATELY,
      lastActive: new Date(),
    });

    return this.lockRepository.save(lock);
  }

  async getLockStatus(userId: number): Promise<{ isLocked: boolean; preferences: LockPreference; lastActive?: Date }> {
    const lock = await this.findByUserId(userId);
    
    if (lock.preferences === LockPreference.OFF) {
      return { isLocked: false, preferences: lock.preferences, lastActive: lock.lastActive };
    }

    if (!lock.lastActive) {
      return { isLocked: true, preferences: lock.preferences, lastActive: lock.lastActive };
    }

    const now = new Date();
    const timeDiff = now.getTime() - lock.lastActive.getTime();
    
    let lockThreshold = 0; // in milliseconds
    
    switch (lock.preferences) {
      case LockPreference.IMMEDIATELY:
        lockThreshold = 0;
        break;
      case LockPreference.ONE_MIN:
        lockThreshold = 1 * 60 * 1000;
        break;
      case LockPreference.FIVE_MIN:
        lockThreshold = 5 * 60 * 1000;
        break;
      case LockPreference.TEN_MIN:
        lockThreshold = 10 * 60 * 1000;
        break;
      case LockPreference.THIRTY_MIN:
        lockThreshold = 30 * 60 * 1000;
        break;
    }

    const isLocked = timeDiff >= lockThreshold;
    
    return { isLocked, preferences: lock.preferences, lastActive: lock.lastActive };
  }
}
