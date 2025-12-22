import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address associated with the account',
    required: true
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the request was processed successfully',
    default: true
  })
  success: boolean;

  @ApiProperty({
    example: 'If your email is registered, a password reset link has been sent to your email.',
    description: 'A message describing the result of the operation',
    examples: [
      'If your email is registered, a password reset link has been sent to your email.',
      'Password reset email sent successfully.'
    ]
  })
  message: string;
}
