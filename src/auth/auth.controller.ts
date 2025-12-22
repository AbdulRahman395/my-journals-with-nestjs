import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Get, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, UserResponseDto } from './dto/login.dto';
import { ForgotPasswordDto, ForgotPasswordResponseDto } from './dto/forgot-password.dto';
import { ResetPasswordDto, ResetPasswordResponseDto } from './dto/reset-password.dto';
import { ResendOtpDto, ResendOtpResponseDto } from './dto/resend-otp.dto';
import { ChangePasswordDto, ChangePasswordResponseDto } from './dto/change-password.dto';
import { RegisterDto, RegisterResponseDto, VerifyAccountDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Creates a new user account and sends a verification email with OTP.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully. Check your email for verification.',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      validUser: {
        summary: 'Valid user registration',
        value: {
          name: 'John Doe',
          email: 'user@example.com',
          passwordHash: 'securePassword123!',
        },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('verify-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify user account',
    description: 'Verifies a user account using the OTP sent to their email.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Account verified successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired OTP',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiBody({
    type: VerifyAccountDto,
    examples: {
      validOtp: {
        summary: 'Valid OTP verification',
        value: {
          email: 'user@example.com',
          otp: '123456',
        },
      },
    },
  })
  async verifyAccount(@Body() verifyAccountDto: VerifyAccountDto): Promise<{ success: boolean; message: string }> {
    return this.authService.verifyAccount(verifyAccountDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User login', 
    description: 'Authenticate user with email and password, returns JWT token for authenticated requests.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request - Missing or invalid fields in request body'
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials - Email or password is incorrect',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Account not verified - Please verify your email address first',
  })
  @ApiBody({ 
    type: LoginDto,
    examples: {
      validUser: {
        summary: 'Valid login credentials',
        value: {
          email: 'user@example.com',
          password: 'your_secure_password'
        }
      }
    }
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Request password reset', 
    description: `Initiates the password reset process by sending a reset OTP to the provided email address.
    
**Note:** For security reasons, this endpoint will always return a success response (200) even if the email doesn't exist in our system.`
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email has been sent if the account exists',
    type: ForgotPasswordResponseDto,
    content: {
      'application/json': {
        examples: {
          success: {
            summary: 'Password reset email sent',
            value: {
              success: true,
              message: 'If your email is registered, a password reset OTP has been sent to your email.'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email format or missing required fields',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many password reset attempts. Please try again later.',
  })
  @ApiBody({ 
    type: ForgotPasswordDto,
    examples: {
      validEmail: {
        summary: 'Valid email request',
        value: {
          email: 'user@example.com'
        }
      },
      invalidEmail: {
        summary: 'Invalid email format',
        value: {
          email: 'not-an-email'
        }
      }
    }
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend OTP',
    description: `Resends a new OTP (One-Time Password) to the provided email address.
    
**Note:** For security reasons, this endpoint has rate limiting to prevent abuse.`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A new OTP has been sent if the email exists',
    type: ResendOtpResponseDto,
    content: {
      'application/json': {
        examples: {
          success: {
            summary: 'OTP resent successfully',
            value: {
              success: true,
              message: 'A new OTP has been sent to your email.'
            }
          },
          rateLimited: {
            summary: 'Rate limited',
            value: {
              success: false,
              message: 'Please wait before requesting another OTP.'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email format or missing required fields',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many OTP requests. Please wait before trying again.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to process OTP resend request',
  })
  @ApiBody({ 
    type: ResendOtpDto,
    examples: {
      validEmail: {
        summary: 'Valid email request',
        value: {
          email: 'user@example.com'
        }
      },
      invalidEmail: {
        summary: 'Invalid email format',
        value: {
          email: 'not-an-email'
        }
      }
    }
  })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto): Promise<ResendOtpResponseDto> {
    return this.authService.resendOtp(resendOtpDto.email);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user password',
    description: `Changes the password for the authenticated user.
    
**Note:** Requires a valid JWT token in the Authorization header.`,
    security: [{ bearerAuth: [] }]
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password has been changed successfully',
    type: ChangePasswordResponseDto,
    content: {
      'application/json': {
        examples: {
          success: {
            summary: 'Password changed successfully',
            value: {
              success: true,
              message: 'Your password has been changed successfully.'
            }
          },
          invalidCurrentPassword: {
            summary: 'Incorrect current password',
            value: {
              success: false,
              message: 'The current password you entered is incorrect.'
            }
          },
          samePassword: {
            summary: 'New password same as current',
            value: {
              success: false,
              message: 'New password cannot be the same as the current password.'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request body or validation failed',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many failed attempts. Please try again later.',
  })
  @ApiBody({ 
    type: ChangePasswordDto,
    examples: {
      validRequest: {
        summary: 'Valid password change request',
        value: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewSecurePassword123!',
        }
      },
      mismatchPasswords: {
        summary: 'Password confirmation mismatch',
        value: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewSecurePassword123!',
        }
      },
      weakPassword: {
        summary: 'Weak new password',
        value: {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'weak', // Too short
        }
      }
    }
  })
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    await this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return {
      success: true,
      message: 'Your password has been changed successfully.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: `Resets the user's password using the OTP sent to their email.
    
**Note:** The OTP is valid for a limited time only.`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password has been reset successfully',
    type: ResetPasswordResponseDto,
    content: {
      'application/json': {
        examples: {
          success: {
            summary: 'Password reset successful',
            value: {
              success: true,
              message: 'Your password has been reset successfully. You can now log in with your new password.'
            }
          },
          invalidOtp: {
            summary: 'Invalid OTP',
            value: {
              success: false,
              message: 'Invalid or expired OTP. Please request a new one.'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request body or OTP format',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No account found with the provided email',
  })
  @ApiResponse({
    status: HttpStatus.GONE,
    description: 'OTP has expired. Please request a new one.',
  })
  @ApiBody({ 
    type: ResetPasswordDto,
    examples: {
      validRequest: {
        summary: 'Valid reset password request',
        value: {
          email: 'user@example.com',
          otp: '123456',
          newPassword: 'NewSecurePassword123!'
        }
      },
      invalidOtp: {
        summary: 'Invalid OTP format',
        value: {
          email: 'user@example.com',
          otp: '12345', // Invalid: must be 6 digits
          newPassword: 'NewSecurePassword123!'
        }
      },
      weakPassword: {
        summary: 'Weak password',
        value: {
          email: 'user@example.com',
          otp: '123456',
          newPassword: 'weak' // Invalid: too short
        }
      }
    }
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
