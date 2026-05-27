import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from '../profiles/entities/user-profile.entity';
import { Journal } from '../journals/entities/journal.entity';
import { Lock } from '../lock/entities/lock.entity';
import { Pin } from '../pin/entities/pin.entity';
import { OTP } from './entities/otp.entity';
import { UserStreak } from '../streaks/entities/user-streak.entity';
import { createPaginationResponse, PaginationResponse } from '../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(Lock)
    private lockRepository: Repository<Lock>,
    @InjectRepository(Pin)
    private pinRepository: Repository<Pin>,
    @InjectRepository(OTP)
    private otpRepository: Repository<OTP>,
    @InjectRepository(UserStreak)
    private userStreakRepository: Repository<UserStreak>,
  ) { }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  /**
   * Get all user profiles with pagination (admin only)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10)
   * @returns Paginated profiles with pagination metadata
   */
  async getAllProfilesPaginated(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResponse<UserProfile>> {
    const skip = (page - 1) * limit;

    const [profiles, total] = await this.userProfileRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    const result = {
      data: profiles,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };

    return createPaginationResponse(result, 'Profiles fetched successfully');
  }

  /**
   * Delete a user and cascade all related records
   * @param id - User ID
   * @returns Deletion confirmation message
   */
  async deleteUser(id: number): Promise<{ message: string; deletedUserId: number }> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Delete related records in correct order (respecting foreign key constraints)
    // Delete journals (will cascade delete journal_media)
    await this.journalRepository.delete({ user_id: id });

    // Delete locks
    await this.lockRepository.delete({ userId: id });

    // Delete pins
    await this.pinRepository.delete({ userId: id });

    // Delete OTPs
    await this.otpRepository.delete({ userId: id });

    // Delete user streak
    await this.userStreakRepository.delete({ user: { id } });

    // Delete user profile
    await this.userProfileRepository.delete({ user_id: id });

    // Finally delete the user
    await this.usersRepository.delete(id);

    return {
      message: `User with ID ${id} and all related records have been successfully deleted`,
      deletedUserId: id,
    };
  }

  /**
   * Validates a user's credentials
   * @param email - User's email
   * @param password - Plain text password
   * @returns The user if credentials are valid, null otherwise
   */
}
