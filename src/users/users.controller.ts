import { Controller, Get, Post, Body, Param, ParseUUIDPipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  name: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address of the user' })
  email: string;

  @ApiProperty({ 
    example: 'hashed_password_123', 
    description: 'Hashed password (use a proper hashing algorithm like bcrypt)' 
  })
  passwordHash: string;
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
}
