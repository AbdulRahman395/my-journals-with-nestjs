import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, MinLength, Length } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address of the user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'hashed_password_123', 
    description: 'Hashed password (use a proper hashing algorithm like bcrypt)' 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  passwordHash: string;
}

export class VerifyAccountDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email address of the user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP received via email' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;
}

export class RegisterResponseDto {
  @ApiProperty({ example: true, description: 'Indicates if the registration was successful' })
  success: boolean;

  @ApiProperty({ 
    example: 'Registration successful. Please check your email to verify your account.',
    description: 'A message describing the result of the registration' 
  })
  message: string;

  @ApiProperty({ 
    example: 'user@example.com',
    description: 'The email address the verification was sent to',
    required: false 
  })
  email?: string;
}
