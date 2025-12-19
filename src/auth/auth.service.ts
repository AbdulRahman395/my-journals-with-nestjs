import { Injectable, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { ForgotPasswordResponseDto } from './dto/forgot-password.dto';
import { sendPasswordResetEmail } from '../mail/templates/email.templates';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    return this.usersService.validateUser(email, password);
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return {
        success: false,
        message: 'Please verify your account first',
      };
    }

    // Validate password
    const isValidPassword = await this.usersService.validateUser(loginDto.email, loginDto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
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
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    this.logger.log(`Processing forgot password request for email: ${email}`);
    
    try {
      const user = await this.usersService.findByEmail(email);
      
      // Don't reveal if user doesn't exist for security reasons
      if (!user) {
        this.logger.log(`No user found with email: ${email}`);
        return {
          success: true,
          message: 'If an account with this email exists, a password reset link has been sent.',
        };
      }

      this.logger.log(`Generating OTP for user: ${user.id}`);
      // Generate OTP for password reset
      const otp = await this.usersService.generatePasswordResetOtp(user.id);
      
      if (!otp) {
        throw new Error('Failed to generate OTP');
      }
      
      this.logger.log(`Sending password reset email to: ${user.email}`);
      // Send password reset email
      const isEmailSent = await sendPasswordResetEmail(
        this.usersService.getMailService(),
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
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
    } catch (error) {
      this.logger.error('Error in forgotPassword:', error);
      throw new Error('Failed to process password reset request');
    }
  }
}
