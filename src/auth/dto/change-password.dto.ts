import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsNotEmpty, Matches } from 'class-validator';

/**
 * Data transfer object for changing a user's password.
 */
export class ChangePasswordDto {
  /**
   * The current password of the user.
   */
  @ApiProperty({
    example: 'CurrentSecurePassword123!',
    description: 'The current password of the user',
    required: true,
    type: String,
    format: 'password'
  })
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'The new password (must be 8-100 characters long and include uppercase, lowercase, number, and special character)',
    required: true,
    minLength: 8,
    maxLength: 100
  })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password cannot be longer than 100 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};:\"\\|,.<>\/?]).{8,}$/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the password was changed successfully',
    default: true
  })
  success: boolean;

  @ApiProperty({
    example: 'Password has been changed successfully',
    description: 'A message describing the result of the operation',
    examples: [
      'Password has been changed successfully',
      'Current password is incorrect',
      'New password cannot be the same as the current password',
      'New password does not meet the requirements'
    ]
  })
  message: string;
}
