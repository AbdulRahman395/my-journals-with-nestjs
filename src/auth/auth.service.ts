import { Injectable, UnauthorizedException, NotFoundException, Logger, BadRequestException, ForbiddenException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { ForgotPasswordResponseDto } from './dto/forgot-password.dto';
import { ResetPasswordDto, ResetPasswordResponseDto } from './dto/reset-password.dto';
import { ResendOtpResponseDto } from './dto/resend-otp.dto';
import { RegisterDto, RegisterResponseDto, VerifyAccountDto, VerifyAccountResponseDto } from './dto/register.dto';
import { sendPasswordResetEmail, sendResendOtpEmail, sendAccountVerificationEmail } from '../mail/templates/email.templates';
import { PasswordUtils } from '../common/utils/password.utils';
import { OtpService } from '../users/otp.service';
import { MailService } from '../mail/mail.service';
import { ProfilesService } from '../profiles/profiles.service';
import { LockService } from '../common/services/lock.service';
import { StreaksService } from '../streaks/streaks.service';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { GoogleLoginResponseDto } from './dto/google-login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Only verifies ID tokens, so it needs no client ID or secret here
  private readonly googleClient = new OAuth2Client();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    private readonly profilesService: ProfilesService,
    private readonly lockService: LockService,
    private readonly streaksService: StreaksService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password before saving
    const hashedPassword = await PasswordUtils.hashPassword(registerDto.passwordHash);
    
    // Create user with hashed password
    const user = this.usersRepository.create({
      email: registerDto.email,
      passwordHash: hashedPassword
    });
    
    const savedUser = await this.usersRepository.save(user);

    // Create default profile for the user
    try {
      await this.profilesService.createDefaultProfile(savedUser.id, registerDto.name);
      this.logger.log(`Default profile created for user: ${savedUser.id}`);
    } catch (profileError) {
      this.logger.error(`Failed to create default profile for user: ${savedUser.id}`, profileError);
      // Continue with registration even if profile creation fails
    }

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
        throw new InternalServerErrorException('Failed to send verification email');
      }

      return {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        email: savedUser.email
      };
    } catch (error) {
      // If email sending fails, clean up the user
      await this.usersRepository.remove(savedUser);
      this.logger.error('Error during registration', error);
      throw new InternalServerErrorException('Failed to complete registration');
    }
  }

  async verifyAccount(verifyAccountDto: VerifyAccountDto): Promise<VerifyAccountResponseDto> {
    const { email, otp } = verifyAccountDto;
    
    // Find the user
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify OTP
    const isValid = await this.otpService.validateOTP(user.id, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Mark email as verified
    user.isEmailVerified = true;
    await this.usersRepository.save(user);

    // Create default lock record for the user
    try {
      await this.lockService.createDefaultLock(user.id);
      this.logger.log(`Default lock record created for user: ${user.id}`);
    } catch (lockError) {
      this.logger.error(`Failed to create default lock record for user: ${user.id}`, lockError);
      // Continue with verification even if lock creation fails
    }

    // Create default streak record for the user
    try {
      await this.streaksService.getOrCreateUserStreak(user.id);
      this.logger.log(`Default streak record created for user: ${user.id}`);
    } catch (streakError) {
      this.logger.error(`Failed to create default streak record for user: ${user.id}`, streakError);
      // Continue with verification even if streak creation fails
    }

    // Generate JWT token for automatic login
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      pinVerified: false,
    };

    const token = this.jwtService.sign(
      payload,
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '7d',
      } as any,
    );

    return {
      success: true,
      message: 'Account verified successfully. You are now logged in.',
      token,
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { email } });
    // Google-only accounts have no password to check
    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await PasswordUtils.comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }
    
    return user;
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify your account first');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Continue with Google. Sign in with Google, or use "Forgot password?" to set a password.',
      );
    }

    // Validate password
    const userFromValidation = await this.validateUser(loginDto.email, loginDto.password);
    if (!userFromValidation) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      pinVerified: false,
    };

    const token = this.jwtService.sign(
      payload,
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '7d',
      } as any, // Using type assertion to bypass the type checking issue
    );

    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async googleLogin(idToken: string): Promise<GoogleLoginResponseDto> {
    const google = await this.verifyGoogleIdToken(idToken);

    let isNewUser = false;
    let user = await this.usersRepository.findOne({ where: { googleId: google.sub } });

    if (!user) {
      // Emails are matched without case, since it is the same mailbox
      const userByEmail = await this.usersRepository
        .createQueryBuilder('user')
        .where('LOWER(user.email) = LOWER(:email)', { email: google.email })
        .getOne();

      if (userByEmail) {
        if (userByEmail.googleId && userByEmail.googleId !== google.sub) {
          throw new ConflictException('This email is already linked to a different Google account');
        }

        // Google has verified this email, so it is safe to link it to the existing account
        userByEmail.googleId = google.sub;
        if (!userByEmail.isEmailVerified) {
          // Whoever registered this email never proved they own it, so their password can't be trusted
          userByEmail.passwordHash = null;
          userByEmail.isEmailVerified = true;
        }
        user = await this.usersRepository.save(userByEmail);
        this.logger.log(`Linked Google account to user: ${user.id}`);
      } else {
        try {
          user = await this.usersRepository.save(
            this.usersRepository.create({
              email: google.email,
              passwordHash: null,
              googleId: google.sub,
              isEmailVerified: true,
            }),
          );
        } catch (error) {
          // Two sign-ins for the same new Google account at once: the other one created the user
          if ((error as any)?.code === '23505') {
            throw new ConflictException('Your account is being set up. Please try again.');
          }
          throw error;
        }
        isNewUser = true;
        this.logger.log(`Created user from Google sign-in: ${user.id}`);

        try {
          await this.profilesService.createDefaultProfile(user.id, google.name);
        } catch (profileError) {
          this.logger.error(`Failed to create default profile for user: ${user.id}`, profileError);
        }
      }
    }

    // Accounts that never finished email verification don't have these yet; both calls are safe to repeat
    try {
      await this.lockService.createDefaultLock(user.id);
    } catch (lockError) {
      this.logger.error(`Failed to create default lock record for user: ${user.id}`, lockError);
    }
    try {
      await this.streaksService.getOrCreateUserStreak(user.id);
    } catch (streakError) {
      this.logger.error(`Failed to create default streak record for user: ${user.id}`, streakError);
    }

    return {
      success: true,
      message: 'Login successful',
      token: this.signToken(user),
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  // Checks the token's signature, expiry, audience (our client ID) and issuer, and that Google verified the email
  private async verifyGoogleIdToken(
    idToken: string,
  ): Promise<{ sub: string; email: string; name?: string }> {
    const clientIds = (this.configService.get<string>('GOOGLE_CLIENT_ID') || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (clientIds.length === 0) {
      this.logger.error('GOOGLE_CLIENT_ID is not set');
      throw new InternalServerErrorException('Google sign-in is not configured');
    }

    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({ idToken, audience: clientIds });
      payload = ticket.getPayload();
    } catch (error) {
      this.logger.warn(`Google ID token rejected: ${(error as Error)?.message}`);
      throw new UnauthorizedException('Invalid or expired Google sign-in. Please try again.');
    }

    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)
    ) {
      throw new UnauthorizedException('Invalid Google sign-in. Please try again.');
    }

    if (payload.email_verified !== true) {
      throw new UnauthorizedException('Your Google email address is not verified');
    }

    return { sub: payload.sub, email: payload.email, name: payload.name };
  }

  private signToken(user: User): string {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      pinVerified: false,
    };

    return this.jwtService.sign(
      payload,
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '7d',
      } as any,
    );
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    this.logger.log(`Processing forgot password request for email: ${email}`);
    
    try {
      const user = await this.usersRepository.findOne({ where: { email } });
      
      // Don't reveal if user doesn't exist for security reasons
      if (!user) {
        this.logger.log(`No user found with email: ${email}`);
        return {
          success: true,
          message: 'Password reset link has been sent.',
        };
      }

      this.logger.log(`Generating OTP for user: ${user.id}`);
      // Generate OTP for password reset
      const otp = await this.otpService.generateOTP(user);
      
      if (!otp) {
        throw new Error('Failed to generate OTP');
      }
      
      this.logger.log(`Sending password reset email to: ${user.email}`);
      // Send password reset email
      const isEmailSent = await sendPasswordResetEmail(
        this.mailService,
        user.email,
        otp
      );

      if (!isEmailSent) {
        this.logger.error(`Failed to send password reset email to: ${user.email}`);
        throw new Error('Failed to send password reset email');
      }

      this.logger.log(`Password reset email sent successfully to: ${user.email}`);
      return {
        success: true,
        message: 'Password reset link has been sent.',
      };
    } catch (error) {
      this.logger.error('Error in forgotPassword:', error);
      throw new Error('Failed to process password reset request');
    }
  }

  async resendOtp(email: string): Promise<ResendOtpResponseDto> {
    this.logger.log(`Processing resend OTP request for email: ${email}`);
    
    try {
      const user = await this.usersService.findByEmail(email);
      
      // Don't reveal if user doesn't exist for security reasons
      if (!user) {
        this.logger.log(`No user found with email: ${email}`);
        // Return success even if user doesn't exist to prevent email enumeration
        return {
          success: true,
          message: 'New OTP has been sent.',
        };
      }

      this.logger.log(`Generating new OTP for user: ${user.id}`);
      // Generate new OTP
      const otp = await this.otpService.generateOTP(user);
      
      if (!otp) {
        throw new BadRequestException('Failed to generate OTP');
      }
      
      this.logger.log(`Sending new OTP to: ${user.email}`);
      // Send OTP email
      const isEmailSent = await sendResendOtpEmail(
        this.mailService,
        user.email,
        otp
      );

      if (!isEmailSent) {
        this.logger.error(`Failed to send OTP email to: ${user.email}`);
        throw new BadRequestException('Failed to send OTP email');
      }

      this.logger.log(`OTP email sent successfully to: ${user.email}`);
      return {
        success: true,
        message: 'New OTP has been sent.',
      };
    } catch (error) {
      this.logger.error('Error in resendOtp:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process OTP resend request');
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      select: ['id', 'passwordHash']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Your account signs in with Google and has no password yet. Use "Forgot password?" on the login page to set one.',
      );
    }

    // Verify current password
    const isPasswordValid = await PasswordUtils.comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is same as current password
    const isSamePassword = await PasswordUtils.comparePasswords(
      newPassword,
      user.passwordHash
    );

    if (isSamePassword) {
      throw new BadRequestException('New password cannot be the same as current password');
    }

    // Hash and save new password
    user.passwordHash = await PasswordUtils.hashPassword(newPassword);
    await this.usersRepository.save(user);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    const { email, otp, newPassword } = resetPasswordDto;
    
    try {
      // Find user by email
      const user = await this.usersRepository.findOne({ where: { email } });
      if (!user) {
        // Don't reveal if user doesn't exist for security reasons
        return {
          success: true,
          message: 'Password has been reset successfully',
        };
      }

      // Verify OTP
      const isOtpValid = await this.otpService.validateOTP(user.id, otp);
      if (!isOtpValid) {
        this.logger.log(`Invalid OTP for user: ${user.id}`);
        throw new BadRequestException('Invalid or expired OTP. Please request a new one.');
      }

      // Update password
      this.logger.log(`Updating password for user: ${user.id}`);
      const hashedPassword = await PasswordUtils.hashPassword(newPassword);
      user.passwordHash = hashedPassword;
      await this.usersRepository.save(user);

      // Mark OTP as used
      await this.otpService.markOtpAsUsed(otp);

      this.logger.log(`Password updated successfully for user: ${user.id}`);
      return {
        success: true,
        message: 'Password has been reset successfully',
      };
    } catch (error) {
      this.logger.error('Error in resetPassword:', error);
      throw new BadRequestException('Failed to reset password');
    }
  }
}
