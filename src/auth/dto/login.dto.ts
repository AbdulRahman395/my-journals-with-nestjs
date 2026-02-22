import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
    required: true
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'your_secure_password',
    description: 'The password for the user account',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the user'
  })
  id: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user'
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user'
  })
  name: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user\'s email has been verified'
  })
  isEmailVerified: boolean;
}

export class LoginResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the login was successful'
  })
  success: boolean;

  @ApiProperty({
    example: 'Login successful',
    description: 'A message describing the result of the login attempt'
  })
  message: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT token for authenticated requests',
    required: false
  })
  token?: string;

  @ApiProperty({
    type: UserResponseDto,
    description: 'User information',
    required: false
  })
  user?: UserResponseDto;
}
