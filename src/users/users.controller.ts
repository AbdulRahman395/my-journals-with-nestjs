import { Controller, Get, Param, ParseIntPipe, HttpStatus, UseGuards, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { AdminPassKeyGuard } from '../auth/guards/admin-pass-key.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @UseGuards(AdminPassKeyGuard)
  @ApiOperation({ summary: 'Get all user profiles with pagination (Admin only)' })
  @ApiQuery({ name: 'adminPassKey', required: true, description: 'Admin pass key from environment' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated profiles',
    schema: {
      properties: {
        message: { type: 'string', example: 'Profiles fetched successfully' },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 10 }
          }
        },
        data: { type: 'array' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'adminPassKey query parameter is required' })
  @ApiResponse({ status: 401, description: 'Invalid admin pass key' })
  async findAllProfiles(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.usersService.getAllProfilesPaginated(Number(page), Number(limit));
  }

  // This endpoint is for verifying the admin pass key without performing any action, useful for testing and validation purposes
  @Get('verify-admin-key')
  @UseGuards(AdminPassKeyGuard)
  @ApiOperation({ summary: 'Verify admin pass key validity (Admin only)' })
  @ApiQuery({ name: 'adminPassKey', required: true, description: 'Admin pass key from environment' })
  @ApiResponse({
    status: 200,
    description: 'Admin pass key is valid',
    schema: {
      properties: {
        message: { type: 'string', example: 'Admin pass key verified' },
        verified: { type: 'boolean', example: true }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'adminPassKey query parameter is required' })
  @ApiResponse({ status: 401, description: 'Invalid admin pass key' })
  async verifyAdminKey() {
    return {
      message: 'Admin pass key verified',
      verified: true,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
  ): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AdminPassKeyGuard)
  @ApiOperation({ summary: 'Delete a user and all related records (Admin only)' })
  @ApiQuery({ name: 'adminPassKey', required: true, description: 'Admin pass key from environment' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully with all related records',
    schema: {
      properties: {
        message: { type: 'string', example: 'User with ID 1 and all related records have been successfully deleted' },
        deletedUserId: { type: 'number', example: 1 }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'adminPassKey query parameter is required' })
  @ApiResponse({ status: 401, description: 'Invalid admin pass key' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST })) id: number,
  ) {
    return this.usersService.deleteUser(id);
  }
}
