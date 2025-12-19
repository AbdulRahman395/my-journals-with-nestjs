import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { OTP } from './entities/otp.entity';
import { User } from './entities/user.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OTP)
    private otpRepository: Repository<OTP>,
  ) {}

  async generateOTP(user: User): Promise<string> {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Save OTP to database
    await this.otpRepository.save({
      user,
      otp,
      expiresAt,
      isUsed: false,
    });

    return otp;
  }

  private readonly logger = new Logger(OtpService.name);

  async validateOTP(userId: string, otp: string): Promise<boolean> {
    try {
      const currentTime = new Date();
      this.logger.log(`Validating OTP for user ${userId} at ${currentTime}`);
      
      const validOtp = await this.otpRepository.findOne({
        where: {
          userId,
          otp,
          isUsed: false,
          expiresAt: MoreThan(currentTime), // Only not expired
        },
      });

      this.logger.log(`OTP validation result: ${!!validOtp}`);
      return !!validOtp;
    } catch (error) {
      this.logger.error('Error validating OTP:', error);
      return false;
    }
  }

  async markOtpAsUsed(otp: string): Promise<void> {
    await this.otpRepository.update(
      { otp },
      { isUsed: true }
    );
  }

  /**
   * Finds an OTP record by user ID and OTP code
   * @param userId - The ID of the user
   * @param otp - The OTP code
   * @returns The OTP record if found, null otherwise
   */
  async getOtpByUserAndCode(userId: string, otp: string): Promise<OTP | null> {
    return this.otpRepository
      .createQueryBuilder('otp')
      .where('otp.userId = :userId', { userId })
      .andWhere('otp.otp = :otp', { otp })
      .andWhere('otp.isUsed = :isUsed', { isUsed: false })
      .andWhere('otp.expiresAt > :currentTime', { currentTime: new Date() })
      .getOne();
  }
}
