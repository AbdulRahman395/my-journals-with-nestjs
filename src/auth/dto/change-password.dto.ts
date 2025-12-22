import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'yourCurrentPassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    description: 'New password (must be different from current password)',
    example: 'yourNewPassword123!',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password cannot be longer than 100 characters' })
  @IsNotEmpty({ message: 'New password is required' })
  newPassword: string;
}

export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'Indicates if the password was changed successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Password has been changed successfully',
  })
  message: string;
}
