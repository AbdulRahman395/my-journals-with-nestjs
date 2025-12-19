import { Controller, Get, Post, Body, Param, ParseUUIDPipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsEmail, IsNotEmpty, MinLength, Length } from 'class-validator';

export class CreateUserDto {
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

export class UserResponse {
  success: boolean;
  message: string;
  data?: User;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Creates a new user account and sends a verification email with OTP.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully. Verification email sent.',
    type: UserResponse
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Missing or invalid fields in request body' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - User with this email already exists' 
  })
  @ApiBody({ 
    type: CreateUserDto,
    description: 'User registration details',
    examples: {
      basic: {
        summary: 'Basic registration',
        value: {
          name: 'John Doe',
          email: 'user@example.com',
          passwordHash: 'hashed_password_123'
        }
      }
    }
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users', type: [User] })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Return the user', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: string,
  ): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Post('verify-account')
  @ApiOperation({ 
    summary: 'Verify user account with OTP',
    description: 'Verifies the user account using the OTP sent to their email.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Account verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Account verified successfully. Please login to continue.' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid or missing fields' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found or invalid OTP' 
  })
  @ApiResponse({ 
    status: 410, 
    description: 'OTP has expired' 
  })
  @ApiBody({ 
    type: VerifyAccountDto,
    description: 'Email and OTP for account verification',
    examples: {
      basic: {
        summary: 'Verify account',
        value: {
          email: 'user@example.com',
          otp: '123456'
        }
      }
    }
  })
  async verifyAccount(@Body() verifyAccountDto: VerifyAccountDto) {
    return this.usersService.verifyAccount(verifyAccountDto.email, verifyAccountDto.otp);
  }
}
