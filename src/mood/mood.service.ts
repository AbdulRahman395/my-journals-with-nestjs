import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, Between } from 'typeorm';
import { Journal, Mood } from '../journals/entities/journal.entity';

@Injectable()
export class MoodService {
  constructor(
    @InjectRepository(Journal)
    private readonly journalRepository: Repository<Journal>,
  ) {}

  async getMoodSummary(userId: number): Promise<Record<string, string>> {
    // Get all journals for the user
    const journals = await this.journalRepository.find({
      where: { 
        user_id: userId,
        mood: Not(IsNull()) // Only get journals with mood data
      },
      select: ['mood']
    });

    if (journals.length === 0) {
      return {
        Happy: "0%",
        Calm: "0%", 
        Neutral: "0%",
        Sad: "0%"
      };
    }

    // Count moods
    const moodCounts = journals.reduce((acc, journal) => {
      if (journal.mood) {
        acc[journal.mood] = (acc[journal.mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<Mood, number>);

    // Calculate percentages
    const total = journals.length;
    const result: Record<string, string> = {};

    // Initialize all moods with 0%
    Object.values(Mood).forEach(mood => {
      result[mood] = "0%";
    });

    // Calculate actual percentages
    Object.entries(moodCounts).forEach(([mood, count]) => {
      const percentage = ((count / total) * 100).toFixed(0);
      result[mood] = `${percentage}%`;
    });

    return result;
  }

  async getMostUsedMoodThisWeek(userId: number): Promise<{ mostUsedMood: string }> {
    // Get current date and last Monday
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysSinceMonday);
    lastMonday.setHours(0, 0, 0, 0);

    // Get journals from last Monday until now
    const journals = await this.journalRepository.find({
      where: { 
        user_id: userId,
        mood: Not(IsNull()),
        created_at: Between(lastMonday, now)
      },
      select: ['mood']
    });

    if (journals.length === 0) {
      return { mostUsedMood: "No journals this week" };
    }

    // Count moods
    const moodCounts = journals.reduce((acc, journal) => {
      if (journal.mood) {
        acc[journal.mood] = (acc[journal.mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<Mood, number>);

    // Find most used mood
    const mostUsedMood = Object.entries(moodCounts).reduce((a, b) => 
      moodCounts[a[0] as Mood] > moodCounts[b[0] as Mood] ? a : b
    )[0];

    return { mostUsedMood };
  }
}
