import { BadRequestException, Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StreaksService } from './streaks.service';
import { User } from '../users/entities/user.entity';
import { UserStreakResponseDto } from './dto/user-streak-response.dto';
import { StreakDayEventDto } from './dto/streak-day-event.dto';
import { GetStreakHistoryQueryDto } from './dto/get-streak-history-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PinVerifiedGuard } from '../auth/guards/pin-verified.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('streaks')
@ApiBearerAuth()
@UseGuards(PinVerifiedGuard)
@Controller('streaks')
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  @Get('last-activity')
  @ApiOperation({ summary: 'Get user last activity date' })
  @ApiResponse({ status: 200, description: 'Returns last activity date' })
  @ApiResponse({ status: 404, description: 'No activity found' })
  async getLastActivity(@CurrentUser() user: User) {
    const streak = await this.streaksService.getUserStreak(user.id);
    if (!streak || !streak.lastActivityDate) {
      return { lastActivityDate: null, message: 'No activity recorded yet' };
    }
    return { lastActivityDate: streak.lastActivityDate };
  }

  @Get('my-streak')
  @ApiOperation({ summary: 'Get current user streak information' })
  @ApiResponse({ status: 200, description: 'Returns user streak information', type: UserStreakResponseDto })
  @ApiResponse({ status: 404, description: 'User streak not found' })
  async getMyStreak(@CurrentUser() user: User) {
    return this.streaksService.evaluateStreakState(user.id);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get day-by-day streak history for the authenticated user',
    description:
      'Defaults to the last `days` calendar days ending today. Pass `month` and `year` together ' +
      'instead to fetch a specific calendar month (the current month is capped at today).',
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Trailing day count (1-31), ignored if month/year are provided' })
  @ApiQuery({ name: 'month', required: false, type: Number, description: 'Calendar month (1-12), must be paired with year' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Calendar year, must be paired with month' })
  @ApiResponse({ status: 200, description: 'Returns the day-by-day streak history', type: [StreakDayEventDto] })
  @ApiResponse({ status: 400, description: 'Invalid or incomplete month/year range' })
  async getHistory(
    @CurrentUser() user: User,
    @Query() query: GetStreakHistoryQueryDto,
  ) {
    const { days, month, year } = query;

    if (month !== undefined || year !== undefined) {
      if (month === undefined || year === undefined) {
        throw new BadRequestException('month and year must be supplied together');
      }
      return this.streaksService.getMonthDayHistory(user.id, month, year);
    }

    return this.streaksService.getRecentDayHistory(user.id, days);
  }

  @Post('update')
  @ApiOperation({ summary: 'Manually update user streak (for testing)' })
  @ApiResponse({ status: 200, description: 'Streak updated successfully', type: UserStreakResponseDto })
  async updateStreak(@CurrentUser() user: User) {
    return this.streaksService.updateUserStreak(user.id);
  }

  @Get('statistics')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get streak statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns streak statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Admin access required' })
  async getStatistics() {
    return this.streaksService.getStreakStatistics();
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset user streak (for testing)' })
  @ApiResponse({ status: 200, description: 'Streak reset successfully', type: UserStreakResponseDto })
  async resetStreak(@CurrentUser() user: User) {
    return this.streaksService.resetUserStreak(user.id);
  }
}
