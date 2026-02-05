import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createDefaultProfile(userId: string): Promise<UserProfile> {
    const profile = this.userProfileRepository.create({
      user_id: userId,
      first_name: null,
      last_name: null,
      date_of_birth: null,
      bio: null,
      profile_picture: null,
    });

    return await this.userProfileRepository.save(profile);
  }

  async getProfileByUserId(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.mapToResponseDto(profile);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    file?: Express.Multer.File,
  ): Promise<ProfileResponseDto> {
    const profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Update only provided fields
    if (updateProfileDto.first_name !== undefined) {
      profile.first_name = updateProfileDto.first_name;
    }
    if (updateProfileDto.last_name !== undefined) {
      profile.last_name = updateProfileDto.last_name;
    }
    if (updateProfileDto.date_of_birth !== undefined) {
      profile.date_of_birth = new Date(updateProfileDto.date_of_birth);
    }
    if (updateProfileDto.bio !== undefined) {
      profile.bio = updateProfileDto.bio;
    }
    
    // Handle file upload
    if (file) {
      // Delete existing profile picture from Cloudinary if it exists
      if (profile.profile_picture) {
        try {
          const urlParts = profile.profile_picture.split('/');
          const uploadIndex = urlParts.indexOf('upload');
          const publicId = urlParts.slice(uploadIndex + 2).join('/').split('.')[0];
          
          await this.cloudinaryService.deleteFile(publicId);
        } catch (error) {
          console.warn('Failed to delete existing profile picture:', error.message);
          // Continue with upload even if deletion fails
        }
      }

      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file, {
          folder: 'profile-pictures',
          resource_type: 'image',
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ]
        });
        profile.profile_picture = uploadResult.secure_url;
      } catch (error) {
        throw new Error(`Failed to upload profile picture: ${error.message}`);
      }
    }

    await this.userProfileRepository.save(profile);

    return this.mapToResponseDto(profile);
  }

  private mapToResponseDto(profile: UserProfile): ProfileResponseDto {
    return {
      id: profile.id,
      user_id: profile.user_id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      date_of_birth: profile.date_of_birth,
      bio: profile.bio,
      profile_picture: profile.profile_picture,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }
}
