import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LockService } from './lock.service';
import { UpdateLockPreferenceDto } from './dto/update-lock-preference.dto';
import { JwtPayload, JwtUser } from '../auth/strategies/jwt.strategy';
import { PinVerifiedGuard } from '../auth/guards/pin-verified.guard';

@ApiTags('lock')
@ApiBearerAuth()
@Controller('lock')
@UseGuards(PinVerifiedGuard)
export class LockController {
  constructor(private readonly lockService: LockService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current lock status for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Lock status retrieved successfully' })
  async getLockStatus(@Request() req: { user: JwtUser }) {
    const userId = parseInt(req.user.id, 10);
    return this.lockService.getLockStatus(userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get lock preferences for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Lock preferences retrieved successfully' })
  async getLockPreferences(@Request() req: { user: JwtUser }) {
    const userId = parseInt(req.user.id, 10);
    const lock = await this.lockService.findByUserId(userId);
    return {
      preferences: lock.preferences,
      lastActive: lock.lastActive,
    };
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update lock preferences for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Lock preferences updated successfully' })
  async updateLockPreference(
    @Request() req: { user: JwtUser },
    @Body() updateLockPreferenceDto: UpdateLockPreferenceDto,
  ) {
    const userId = parseInt(req.user.id, 10);
    return this.lockService.updateLockPreference(userId, updateLockPreferenceDto);
  }

  @Put('last-active')
  @ApiOperation({ summary: 'Update last active timestamp for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Last active timestamp updated successfully' })
  async updateLastActive(@Request() req: { user: JwtUser }) {
    const userId = parseInt(req.user.id, 10);
    return this.lockService.updateLastActive(userId);
  }
}
