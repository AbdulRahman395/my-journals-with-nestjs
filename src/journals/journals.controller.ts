import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtMiddleware } from '../auth/middleware/jwt.middleware';
import { JournalsService } from './journals.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { JournalResponseDto } from './dto/journal-response.dto';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileUpload } from '../common/types/file.types';

@ApiTags('journals')
@ApiBearerAuth()
@UseGuards(JwtMiddleware)
@Controller('journals')
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new journal entry' })
  @ApiResponse({ status: 201, description: 'Journal created successfully', type: JournalResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Body() createJournalDto: CreateJournalDto,
    @UploadedFiles() files: FileUpload[] = [],
    @CurrentUser() user: User,
  ) {
    if (!user || !user.id) {
      throw new UnauthorizedException('Invalid user');
    }
    return this.journalsService.create(createJournalDto, files, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated journals for the authenticated user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated journals for the user',
    schema: {
      properties: {
        message: { type: 'string', example: 'Fetch successful' },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 10 }
          }
        },
        data: { type: 'array', items: { $ref: '#/components/schemas/Journal' } }
      }
    }
  })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.journalsService.findAll(Number(user.id), Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific journal entry by ID' })
  @ApiResponse({ status: 200, description: 'The journal entry', type: JournalResponseDto })
  @ApiResponse({ status: 404, description: 'Journal not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.journalsService.findOne(id, Number(user.id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal entry' })
  @ApiResponse({ status: 200, description: 'Journal updated successfully', type: JournalResponseDto })
  @ApiResponse({ status: 404, description: 'Journal not found' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJournalDto: UpdateJournalDto,
    @UploadedFiles() files: FileUpload[] = [],
    @CurrentUser() user: User,
  ) {
    return this.journalsService.update(id, updateJournalDto, files, Number(user.id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a journal entry' })
  @ApiResponse({ status: 200, description: 'Journal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Journal not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.journalsService.remove(id, Number(user.id));
  }

  @Delete('media/:mediaId')
  @ApiOperation({ summary: 'Delete a media file from a journal entry' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async removeMedia(
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @CurrentUser() user: User,
  ) {
    return this.journalsService.removeMedia(mediaId, Number(user.id));
  }
}
