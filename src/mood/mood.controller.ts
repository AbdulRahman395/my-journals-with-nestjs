import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MoodService } from './mood.service';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PinVerifiedGuard } from '../auth/guards/pin-verified.guard';

@ApiTags('mood')
@ApiBearerAuth()
@UseGuards(PinVerifiedGuard)
@Controller('mood')
export class MoodController {
  constructor(private readonly moodService: MoodService) {}

  @Get('mood-summary')
  @ApiOperation({ summary: 'Get mood distribution summary for authenticated user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns percentage distribution of each mood',
    schema: {
      example: {
        "Happy": "70%",
        "Calm": "10%",
        "Neutral": "10%",
        "Sad": "10%"
      }
    }
  })
  async getMoodSummary(@CurrentUser() user: User) {
    return this.moodService.getMoodSummary(Number(user.id));
  }

  @Get('mood-this-week')
  @ApiOperation({ summary: 'Get most used mood this week for authenticated user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the most frequently used mood this week',
    schema: {
      example: {
        "mostUsedMood": "Happy"
      }
    }
  })
  async getMoodThisWeek(@CurrentUser() user: User) {
    return this.moodService.getMostUsedMoodThisWeek(Number(user.id));
  }
}
