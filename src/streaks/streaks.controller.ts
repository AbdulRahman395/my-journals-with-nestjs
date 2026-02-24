import { Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StreaksService } from './streaks.service';
import { User } from '../users/entities/user.entity';
import { UserStreakResponseDto } from './dto/user-streak-response.dto';
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
    const streak = await this.streaksService.getUserStreak(user.id);
    if (!streak) {
      return { currentStreak: 0 };
    }
    return { currentStreak: streak.currentStreak };
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
