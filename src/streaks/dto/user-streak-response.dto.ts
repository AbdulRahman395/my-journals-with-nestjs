import { ApiProperty } from '@nestjs/swagger';

export class UserStreakResponseDto {
  @ApiProperty({ description: 'Streak record ID' })
  id: number;

  @ApiProperty({ description: 'Current streak count' })
  currentStreak: number;

  @ApiProperty({ description: 'Longest streak achieved' })
  longestStreak: number;

  @ApiProperty({ description: 'Date of last activity', required: false })
  lastActivityDate?: Date;

  @ApiProperty({ description: 'Number of streak freezes available (0-3)' })
  freezeCount: number;

  @ApiProperty({
    description: 'Read-time evaluated streak state',
    enum: ['new', 'active', 'pending', 'frozen', 'broken'],
  })
  state: string;

  @ApiProperty({ description: 'Whether the streak should be shown as dimmed (not confirmed for today yet)' })
  isDimmed: boolean;

  @ApiProperty({ description: 'Whether today\'s gap is currently covered by a streak freeze' })
  isFrozen: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
