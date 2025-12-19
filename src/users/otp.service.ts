import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async validateOTP(userId: string, otp: string): Promise<boolean> {
    const validOtp = await this.otpRepository.findOne({
      where: {
        userId,
        otp,
        isUsed: false,
        expiresAt: new Date(), // Only not expired
      },
    });

    return !!validOtp;
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
