import { Controller, Get, Patch, Body, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { PinVerifiedGuard } from '../auth/guards/pin-verified.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Controller('profiles')
@UseGuards(PinVerifiedGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getMyProfile(@Request() req: { user: { id: string; email: string; isEmailVerified: boolean; pinVerified: boolean } }): Promise<ProfileResponseDto> {
    return this.profilesService.getProfileByUserId(req.user.id);
  }

  @Patch('me')
  @UseInterceptors(FileInterceptor('profile_picture'))
  async updateMyProfile(
    @Request() req: { user: { id: string; email: string; isEmailVerified: boolean; pinVerified: boolean } },
    @UploadedFile() file: Express.Multer.File,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.updateProfile(req.user.id, updateProfileDto, file);
  }
}
