import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsNotEmpty } from 'class-validator';

/**
 * Data transfer object for changing a user's PIN.
 */
export class ChangePinDto {
  /**
   * The current PIN of the user.
   */
  @ApiProperty({
    example: '1234',
    description: 'The current PIN of the user (4-6 digits)',
    required: true,
    minLength: 4,
    maxLength: 6
  })
  @IsString({ message: 'Current PIN must be a string' })
  @IsNotEmpty({ message: 'Current PIN is required' })
  @Length(4, 6, { message: 'PIN must be between 4 and 6 characters' })
  currentPin: string;

  /**
   * The new PIN for the user.
   */
  @ApiProperty({
    example: '5678',
    description: 'The new PIN (must be 4-6 digits and different from current PIN)',
    required: true,
    minLength: 4,
    maxLength: 6
  })
  @IsString({ message: 'New PIN must be a string' })
  @IsNotEmpty({ message: 'New PIN is required' })
  @Length(4, 6, { message: 'PIN must be between 4 and 6 characters' })
  newPin: string;
}

export class ChangePinResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the PIN was changed successfully',
    default: true
  })
  success: boolean;

  @ApiProperty({
    example: 'Your PIN has been changed successfully.',
    description: 'A message describing the result of the operation',
    examples: [
      'Your PIN has been changed successfully.',
      'Current PIN is incorrect',
      'New PIN cannot be the same as the current PIN'
    ]
  })
  message: string;
}
