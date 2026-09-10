import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { UserStreak } from './entities/user-streak.entity';
import { StreakDayEvent, StreakDayEventType } from './entities/streak-day-event.entity';
import { UserProfile } from '../profiles/entities/user-profile.entity';
import { User } from '../users/entities/user.entity';

export type StreakState = 'new' | 'active' | 'pending' | 'frozen' | 'broken';

export interface StreakDayHistoryEntry {
  date: string;
  type: 'empty' | StreakDayEventType;
}

export interface StreakEvaluation {
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
  state: StreakState;
  isDimmed: boolean;
  isFrozen: boolean;
  lastActivityDate: Date | null;
}

export interface StreakUpdateResult extends StreakEvaluation {
  freezeEarned?: boolean;
}

const MS_PER_DAY = 86_400_000;

@Injectable()
export class StreaksService {
  constructor(
    @InjectRepository(UserStreak)
    private readonly userStreakRepository: Repository<UserStreak>,
    @InjectRepository(StreakDayEvent)
    private readonly streakDayEventRepository: Repository<StreakDayEvent>,
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
   * Normalize an arbitrary date value to midnight in the user's timezone
   */
  private normalizeToTimezone(date: Date | string, timezone: string): Date {
    return new Date(new Date(date).toLocaleDateString('en-CA', { timeZone: timezone }));
  }

  /**
   * Resolve the user's timezone from their profile, defaulting to UTC
   */
  private async getUserTimezone(userId: number): Promise<string> {
    const profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });
    return profile?.timezone ?? 'UTC';
  }

  /**
   * Permanently record the outcome of a streak-relevant day. Relies on the
   * UNIQUE (user_id, event_date) constraint so this is safe to call more than
   * once for the same user/day - the first recorded outcome always wins and
   * later calls never overwrite it.
   */
  private async recordDayEvent(
    userId: number,
    eventDate: Date,
    eventType: StreakDayEventType,
  ): Promise<void> {
    const dateStr = eventDate.toISOString().slice(0, 10);
    await this.streakDayEventRepository.query(
      `INSERT INTO streak_day_events (user_id, event_date, event_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, event_date) DO NOTHING`,
      [userId, dateStr, eventType],
    );
  }

  private toEvaluation(
    streak: UserStreak,
    state: StreakState,
    isDimmed: boolean,
    isFrozen: boolean,
    currentStreakOverride?: number,
  ): StreakEvaluation {
    return {
      currentStreak: currentStreakOverride ?? streak.currentStreak,
      longestStreak: streak.longestStreak,
      freezeCount: streak.freezeCount,
      state,
      isDimmed,
      isFrozen,
      lastActivityDate: streak.lastActivityDate,
    };
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
   * Evaluate the true, read-time state of a user's streak, resolving any staleness
   * against "today" without requiring a new journal entry. This is the single source
   * of truth for streak freshness - reads and writes both build on top of it.
   *
   * - lastActivityDate is null            -> 'new'
   * - diffDays === 0 (posted today)       -> 'active'
   * - diffDays === 1 (posted yesterday)   -> 'pending'
   * - diffDays === 2 (one day skipped)    -> 'frozen' (if a freeze is available/applied) or 'broken'
   * - diffDays >= 3 (more than one day)   -> 'broken'
   *
   * Only writes to the DB when the stored state actually needs to change, so repeated
   * calls on the same day are idempotent.
   */
  async evaluateStreakState(userId: number): Promise<StreakEvaluation> {
    const streak = await this.getOrCreateUserStreak(userId);

    if (!streak.lastActivityDate) {
      return this.toEvaluation(streak, 'new', true, false, 0);
    }

    const timezone = await this.getUserTimezone(userId);
    const today = this.getTodayInTimezone(timezone);
    const lastActivityDate = this.normalizeToTimezone(streak.lastActivityDate, timezone);
    const diffDays = Math.round((today.getTime() - lastActivityDate.getTime()) / MS_PER_DAY);

    // Already had activity today
    if (diffDays === 0) {
      return this.toEvaluation(streak, 'active', false, false);
    }

    // Posted yesterday, nothing missed yet - the rest of today is still available
    if (diffDays === 1) {
      return this.toEvaluation(streak, 'pending', true, false);
    }

    // Exactly one full calendar day was skipped - freeze-eligible
    if (diffDays === 2) {
      const skippedDate = new Date(lastActivityDate);
      skippedDate.setDate(skippedDate.getDate() + 1);

      const frozenDate = streak.frozenDate
        ? this.normalizeToTimezone(streak.frozenDate, timezone)
        : null;

      // A freeze was already applied for this exact gap (idempotent re-evaluation)
      if (frozenDate && frozenDate.getTime() === skippedDate.getTime()) {
        return this.toEvaluation(streak, 'frozen', true, true);
      }

      if (streak.freezeCount > 0) {
        streak.freezeCount -= 1;
        streak.frozenDate = skippedDate;
        await this.userStreakRepository.save(streak);
        await this.recordDayEvent(userId, skippedDate, 'frozen');
        return this.toEvaluation(streak, 'frozen', true, true);
      }

      if (streak.currentStreak !== 0) {
        streak.currentStreak = 0;
        await this.userStreakRepository.save(streak);
      }
      return this.toEvaluation(streak, 'broken', true, false);
    }

    // More than one full day skipped - a freeze only ever covers a single missed day
    if (streak.currentStreak !== 0) {
      streak.currentStreak = 0;
      await this.userStreakRepository.save(streak);
    }
    return this.toEvaluation(streak, 'broken', true, false);
  }

  /**
   * Update user streak based on activity. Called once, right after a journal is
   * successfully created. First normalizes any stale state via evaluateStreakState,
   * then applies the "posted today" transition on top of the normalized state.
   */
  async updateUserStreak(userId: number): Promise<StreakUpdateResult> {
    const evaluation = await this.evaluateStreakState(userId);

    // Already posted today via an earlier journal entry - idempotent, nothing to do
    if (evaluation.state === 'active') {
      return { ...evaluation, freezeEarned: false };
    }

    // Reload the streak row since evaluateStreakState may have mutated it
    const streak = await this.getOrCreateUserStreak(userId);
    const timezone = await this.getUserTimezone(userId);
    const today = this.getTodayInTimezone(timezone);

    if (evaluation.state === 'pending') {
      streak.currentStreak += 1;
      streak.lastActivityDate = today;
    } else if (evaluation.state === 'frozen') {
      // The gap was just covered by a freeze; posting today continues the streak
      streak.currentStreak += 1;
      streak.lastActivityDate = today;
      streak.frozenDate = null;
    } else {
      // 'broken' or 'new'
      streak.currentStreak = 1;
      streak.lastActivityDate = today;
      streak.frozenDate = null;
    }

    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

    let freezeEarned = false;
    if (streak.currentStreak % 30 === 0) {
      const milestone = streak.currentStreak / 30;
      if (milestone > streak.lastFreezeMilestone) {
        streak.lastFreezeMilestone = milestone;
        if (streak.freezeCount < 3) {
          streak.freezeCount += 1;
          freezeEarned = true;
        }
      }
    }

    const saved = await this.userStreakRepository.save(streak);
    await this.recordDayEvent(userId, today, 'active');

    return {
      ...this.toEvaluation(saved, 'active', false, false),
      freezeEarned,
    };
  }

  /**
   * Get the last `days` calendar days (ending today, in the user's timezone),
   * oldest first, with each day's finalized outcome: 'active' (a real journal
   * was posted), 'frozen' (a freeze covered the day), or 'empty' (neither).
   */
  async getRecentDayHistory(userId: number, days = 7): Promise<StreakDayHistoryEntry[]> {
    const clampedDays = Math.min(Math.max(Number.isFinite(days) ? days : 7, 1), 31);
    const timezone = await this.getUserTimezone(userId);
    const today = this.getTodayInTimezone(timezone);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (clampedDays - 1));

    const events = await this.streakDayEventRepository.find({
      where: {
        user: { id: userId },
        eventDate: Between(startDate, today),
      },
    });

    const eventsByDate = new Map<string, StreakDayEventType>(
      events.map((event) => [
        this.normalizeToTimezone(event.eventDate, timezone).toISOString().slice(0, 10),
        event.eventType,
      ]),
    );

    const history: StreakDayHistoryEntry[] = [];
    for (let i = 0; i < clampedDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      history.push({ date: dateStr, type: eventsByDate.get(dateStr) ?? 'empty' });
    }

    return history;
  }

  /**
   * Get the day-by-day streak history for a specific calendar month (in the
   * user's timezone), oldest first. Mirrors getRecentDayHistory's shape and
   * gap-filling ('empty' for days with no matching event), but for an
   * arbitrary month/year instead of a trailing N-day window. The current,
   * partially-elapsed month is capped at today so no future dates are
   * returned; any month after the user's current month is rejected outright.
   */
  async getMonthDayHistory(
    userId: number,
    month: number,
    year: number,
  ): Promise<StreakDayHistoryEntry[]> {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('month must be an integer between 1 and 12');
    }
    if (!Number.isInteger(year)) {
      throw new BadRequestException('year must be a valid integer');
    }

    const timezone = await this.getUserTimezone(userId);
    const today = this.getTodayInTimezone(timezone);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      throw new BadRequestException('Cannot fetch streak history for a future month');
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    const startDate = new Date(`${year}-${pad(month)}-01`);
    const daysInMonth = new Date(year, month, 0).getDate();
    let endDate = new Date(`${year}-${pad(month)}-${pad(daysInMonth)}`);

    const isCurrentMonth = year === currentYear && month === currentMonth;
    if (isCurrentMonth && endDate.getTime() > today.getTime()) {
      endDate = today;
    }

    const events = await this.streakDayEventRepository.find({
      where: {
        user: { id: userId },
        eventDate: Between(startDate, endDate),
      },
    });

    const eventsByDate = new Map<string, StreakDayEventType>(
      events.map((event) => [
        this.normalizeToTimezone(event.eventDate, timezone).toISOString().slice(0, 10),
        event.eventType,
      ]),
    );

    const history: StreakDayHistoryEntry[] = [];
    const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().slice(0, 10);
      history.push({ date: dateStr, type: eventsByDate.get(dateStr) ?? 'empty' });
    }

    return history;
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
    streak.freezeCount = 0;
    streak.frozenDate = null;
    streak.lastFreezeMilestone = 0;

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
