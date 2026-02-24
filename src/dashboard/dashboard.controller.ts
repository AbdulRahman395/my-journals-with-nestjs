import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PinVerifiedGuard } from '../auth/guards/pin-verified.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(PinVerifiedGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard data for authenticated user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns dashboard statistics',
    schema: {
      example: {
        totalJournals: 150,
        journalsThisWeek: 5,
        writingStreak: 12,
        moodThisWeek: "Happy"
      }
    }
  })
  async getDashboard(@CurrentUser() user: User) {
    return this.dashboardService.getDashboardData(Number(user.id));
  }
}
