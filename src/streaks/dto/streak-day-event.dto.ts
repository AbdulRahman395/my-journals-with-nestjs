import { ApiProperty } from '@nestjs/swagger';

export class StreakDayEventDto {
  @ApiProperty({ description: 'Calendar date (YYYY-MM-DD) in the user\'s timezone' })
  date: string;

  @ApiProperty({
    description: 'Outcome for this day',
    enum: ['empty', 'active', 'frozen'],
  })
  type: 'empty' | 'active' | 'frozen';
}
