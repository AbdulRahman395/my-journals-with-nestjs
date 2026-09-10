import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetStreakHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Number of trailing days to return, ending today. Ignored if month/year are provided.',
    minimum: 1,
    maximum: 31,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  days?: number;

  @ApiPropertyOptional({ description: 'Calendar month (1-12). Must be supplied together with year.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ description: 'Calendar year. Must be supplied together with month.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;
}
