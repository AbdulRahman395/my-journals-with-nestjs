import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address associated with the account',
    required: true
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'The one-time password (OTP) received via email',
    required: true,
    minLength: 6,
    maxLength: 6
  })
  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  otp: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'The new password for the account (min 8 characters)',
    required: true,
    minLength: 8
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the password was reset successfully',
    default: true
  })
  success: boolean;

  @ApiProperty({
    example: 'Password has been reset successfully',
    description: 'A message describing the result of the operation',
    examples: [
      'Password has been reset successfully',
      'Invalid or expired OTP',
      'User not found'
    ]
  })
  message: string;
}
