import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

/**
 * Data transfer object for initiating PIN reset flow.
 */
export class ForgetPinDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address associated with the account',
    required: true
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

/**
 * Data transfer object for resetting PIN with OTP verification.
 */
export class ResetPinDto {
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
  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  otp: string;

  @ApiProperty({
    example: '5678',
    description: 'The new PIN for the account (4-6 digits)',
    required: true,
    minLength: 4,
    maxLength: 6
  })
  @IsString({ message: 'New PIN must be a string' })
  @IsNotEmpty({ message: 'New PIN is required' })
  @Length(4, 6, { message: 'PIN must be between 4 and 6 characters' })
  newPin: string;
}

export class ForgetPinResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the request was processed successfully',
    default: true
  })
  success: boolean;

  @ApiProperty({
    example: 'If your email is registered, a PIN reset OTP has been sent to your email.',
    description: 'A message describing the result of the operation',
    examples: [
      'If your email is registered, a PIN reset OTP has been sent to your email.',
      'PIN reset email sent successfully.'
    ]
  })
  message: string;
}

export class ResetPinResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the PIN was reset successfully',
    default: true
  })
  success: boolean;

  @ApiProperty({
    example: 'Your PIN has been reset successfully',
    description: 'A message describing the result of the operation',
    examples: [
      'Your PIN has been reset successfully',
      'Invalid or expired OTP',
      'User not found'
    ]
  })
  message: string;
}
