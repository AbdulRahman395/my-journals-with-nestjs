import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStreak } from './entities/user-streak.entity';
import { UserProfile } from '../profiles/entities/user-profile.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StreaksService {
  constructor(
    @InjectRepository(UserStreak)
    private readonly userStreakRepository: Repository<UserStreak>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
  ) { }

  /**
   * Get today's date normalized to midnight in the user's timezone
   */
  private getTodayInTimezone(timezone: string): Date {
    const now = new Date();
    const localDateStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // gives "YYYY-MM-DD"
    return new Date(localDateStr); // midnight UTC representation of local date
  }

  /**
   * Get or create a streak record for a user
   */
  async getOrCreateUserStreak(userId: number): Promise<UserStreak> {
    let streak = await this.userStreakRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!streak) {
      streak = this.userStreakRepository.create({
        user: { id: userId } as User,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
      });
      streak = await this.userStreakRepository.save(streak);
    }

    return streak;
  }

  /**
   * Update user streak based on activity
   * Implements the streak logic:
   * 1. If today == last_activity_date → Do nothing
   * 2. If today == last_activity_date + 1 → current_streak += 1
   * 3. Otherwise → current_streak = 1
   * Always update longest_streak = max(longest_streak, current_streak)
   */
  async updateUserStreak(userId: number): Promise<UserStreak> {
    const streak = await this.getOrCreateUserStreak(userId);

    // Fetch user's timezone from profile, fallback to UTC
    const profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });
    const timezone = profile?.timezone ?? 'UTC';

    const today = this.getTodayInTimezone(timezone);

    const lastActivityDate = streak.lastActivityDate
      ? new Date(new Date(streak.lastActivityDate).toLocaleDateString('en-CA', { timeZone: timezone }))
      : null;

    // Case 1: Already had activity today
    if (lastActivityDate && today.getTime() === lastActivityDate.getTime()) {
      return streak;
    }

    // Case 2: Consecutive day (today == last_activity_date + 1 day)
    if (lastActivityDate) {
      const nextDay = new Date(lastActivityDate);
      nextDay.setDate(nextDay.getDate() + 1);

      if (today.getTime() === nextDay.getTime()) {
        streak.currentStreak += 1;
      } else {
        // Case 3: Streak broken - start new streak
        streak.currentStreak = 1;
      }
    } else {
      // First activity ever
      streak.currentStreak = 1;
    }

    // Always update longest streak
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

    // Update last activity date
    streak.lastActivityDate = today;

    return this.userStreakRepository.save(streak);
  }

  /**
   * Get user's current streak information
   */
  async getUserStreak(userId: number): Promise<UserStreak | null> {
    return this.userStreakRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  /**
   * Reset user streak (for testing or administrative purposes)
   */
  async resetUserStreak(userId: number): Promise<UserStreak> {
    const streak = await this.getOrCreateUserStreak(userId);
    streak.currentStreak = 0;
    streak.longestStreak = 0;
    streak.lastActivityDate = null;

    return this.userStreakRepository.save(streak);
  }

  /**
   * Get streak statistics for multiple users (admin function)
   */
  async getStreakStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    averageCurrentStreak: number;
    averageLongestStreak: number;
    topStreaks: UserStreak[];
  }> {
    const [totalUsers, activeUsers, streaks] = await Promise.all([
      this.userStreakRepository.count(),
      this.userStreakRepository.count({
        where: { currentStreak: 1 },
      }),
      this.userStreakRepository.find({
        order: { longestStreak: 'DESC' },
        take: 10,
        relations: ['user'],
      }),
    ]);

    const stats = await this.userStreakRepository
      .createQueryBuilder('userStreak')
      .select('AVG(userStreak.currentStreak)', 'avgCurrent')
      .addSelect('AVG(userStreak.longestStreak)', 'avgLongest')
      .getRawOne();

    return {
      totalUsers,
      activeUsers,
      averageCurrentStreak: parseFloat(stats.avgCurrent) || 0,
      averageLongestStreak: parseFloat(stats.avgLongest) || 0,
      topStreaks: streaks,
    };
  }
}