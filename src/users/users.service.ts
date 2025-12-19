import { Injectable, ConflictException, NotFoundException, InternalServerErrorException, Logger, GoneException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { OtpService } from './otp.service';
import { MailService } from '../mail/mail.service';
import { sendAccountVerificationEmail } from '../mail/templates/email.templates';

import { CreateUserDto } from './users.controller';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ success: boolean; message: string }> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user
    const user = this.usersRepository.create(createUserDto);
    const savedUser = await this.usersRepository.save(user);

    try {
      // Generate OTP
      const otp = await this.otpService.generateOTP(savedUser);
      
      // Send verification email
      this.logger.log(`Sending verification email to ${savedUser.email}`);
      const isEmailSent = await sendAccountVerificationEmail(
        this.mailService,
        savedUser.email,
        otp
      );

      if (!isEmailSent) {
        throw new InternalServerErrorException('Failed to send verification email. Please try again later.');
      }

      this.logger.log(`Verification email sent successfully to ${savedUser.email}`);
      return {
        success: true,
        message: 'Verification email has been sent successfully.'
      };
    } catch (error) {
      this.logger.error('Error in user creation process', error);
      
      // If email sending fails, delete the user to maintain data consistency
      try {
        await this.usersRepository.remove(savedUser);
        this.logger.log(`Rolled back user creation for ${savedUser.email} due to email sending failure`);
      } catch (rollbackError) {
        this.logger.error('Error during user rollback', rollbackError);
      }
      
      // Provide more detailed error message
      if (error instanceof Error) {
        if (error.message.includes('Invalid login')) {
          throw new InternalServerErrorException('Email authentication failed. Please check your email service configuration.');
        }
        if (error.message.includes('getaddrinfo ENOTFOUND')) {
          throw new InternalServerErrorException('Could not connect to email server. Please check your network connection.');
        }
      }
      
      throw new InternalServerErrorException('Failed to complete registration. Please try again later.');
    }
  }

  async findOne(id: string): Promise<User> {
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
   * Verifies a user's account using the provided OTP
   * @param email - User's email address
   * @param otp - 6-digit OTP code
   * @returns Object with success status and message
   */
  async verifyAccount(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    // Find the user by email
    const user = await this.findByEmail(email);
    if (!user) {
      this.logger.warn(`Verify account attempt with non-existent email: ${email}`);
      throw new NotFoundException('User not found');
    }

    // Find the OTP record
    const otpRecord = await this.otpService.getOtpByUserAndCode(user.id, otp);
    if (!otpRecord) {
      this.logger.warn(`Invalid OTP attempt for user: ${email}`);
      throw new NotFoundException('Invalid or expired OTP');
    }

    // Check if OTP is already used
    if (otpRecord.isUsed) {
      this.logger.warn(`Attempt to use already used OTP for user: ${email}`);
      throw new ConflictException('This OTP has already been used');
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      this.logger.warn(`Expired OTP attempt for user: ${email}`);
      throw new ConflictException('OTP has expired');
    }

    try {
      // Mark OTP as used
      await this.otpService.markOtpAsUsed(otp);
      
      // Update user's email verification status
      await this.usersRepository.update(user.id, { isEmailVerified: true });
      
      this.logger.log(`Account verified successfully for user: ${email}`);
      
      return {
        success: true,
        message: 'Account verified successfully. Please login to continue.'
      };
    } catch (error) {
      this.logger.error(`Error verifying account for ${email}:`, error);
      throw new InternalServerErrorException('Failed to verify account. Please try again.');
    }
  }
}
