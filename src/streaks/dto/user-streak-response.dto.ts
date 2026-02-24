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

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
