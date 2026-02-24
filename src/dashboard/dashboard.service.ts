import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull } from 'typeorm';
import { Journal } from '../journals/entities/journal.entity';
import { UserStreak } from '../streaks/entities/user-streak.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Journal)
    private readonly journalRepository: Repository<Journal>,
    @InjectRepository(UserStreak)
    private readonly userStreakRepository: Repository<UserStreak>,
  ) {}

  private getWeekRange() {
    const now = new Date();
    const currentDay = now.getDay();
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysSinceMonday);
    lastMonday.setHours(0, 0, 0, 0);
    return { startOfWeek: lastMonday, now };
  }

  async getDashboardData(userId: number) {
    const { startOfWeek, now } = this.getWeekRange();

    // Single query to get all journal data we need
    const [totalJournals, weeklyJournals, userStreak] = await Promise.all([
      this.journalRepository.count({ where: { user_id: userId } }),
      this.journalRepository.count({
        where: {
          user_id: userId,
          created_at: Between(startOfWeek, now)
        }
      }),
      this.userStreakRepository.findOne({
        where: { user: { id: userId } }
      })
    ]);

    // Get most used mood this week (reuse existing logic)
    const weeklyJournalsWithMood = await this.journalRepository.find({
      where: {
        user_id: userId,
        mood: Not(IsNull()),
        created_at: Between(startOfWeek, now)
      },
      select: ['mood']
    });

    let moodThisWeek = "No journals this week";
    if (weeklyJournalsWithMood.length > 0) {
      const moodCounts = weeklyJournalsWithMood.reduce((acc, journal) => {
        if (journal.mood) {
          acc[journal.mood] = (acc[journal.mood] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      moodThisWeek = Object.entries(moodCounts).reduce((a, b) => 
        moodCounts[a[0]] > moodCounts[b[0]] ? a : b
      )[0];
    }

    return {
      totalJournals,
      journalsThisWeek: weeklyJournals,
      writingStreak: userStreak?.currentStreak || 0,
      moodThisWeek
    };
  }
}
