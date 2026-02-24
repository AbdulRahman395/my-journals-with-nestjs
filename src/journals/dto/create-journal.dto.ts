import { IsDateString, IsOptional, IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Mood } from '../entities/journal.entity';

export class CreateJournalDto {
  @ApiProperty({ description: 'Title of the journal entry', example: 'My Day at the Beach' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Content of the journal entry', example: 'Today I went to the beach and had a great time...' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ 
    description: 'Date of the journal entry in YYYY-MM-DD format', 
    example: '2023-01-01',
    required: true
  })
  @IsDateString()
  journalDate: string;

  @ApiProperty({ 
    description: 'Mood of the journal entry', 
    enum: Mood,
    example: Mood.HAPPY,
    required: true
  })
  @IsEnum(Mood)
  @IsNotEmpty()
  mood: Mood;

  @ApiProperty({ 
    description: 'Additional metadata for the journal entry',
    example: { weather: 'sunny', location: 'beach' },
    required: false 
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
