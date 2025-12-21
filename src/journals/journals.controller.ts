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
  ParseUUIDPipe,
  UnauthorizedException,
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
  @ApiOperation({ summary: 'Get all journal entries for the current user' })
  @ApiResponse({ status: 200, description: 'List of journal entries', type: [JournalResponseDto] })
  async findAll(@CurrentUser() user: User) {
    return this.journalsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific journal entry by ID' })
  @ApiResponse({ status: 200, description: 'The journal entry', type: JournalResponseDto })
  @ApiResponse({ status: 404, description: 'Journal not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.journalsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a journal entry' })
  @ApiResponse({ status: 200, description: 'Journal updated successfully', type: JournalResponseDto })
  @ApiResponse({ status: 404, description: 'Journal not found' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateJournalDto: UpdateJournalDto,
    @UploadedFiles() files: FileUpload[] = [],
    @CurrentUser() user: User,
  ) {
    return this.journalsService.update(id, updateJournalDto, files, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a journal entry' })
  @ApiResponse({ status: 200, description: 'Journal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Journal not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.journalsService.remove(id, user.id);
  }

  @Delete('media/:mediaId')
  @ApiOperation({ summary: 'Delete a media file from a journal entry' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  async removeMedia(
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @CurrentUser() user: User,
  ) {
    return this.journalsService.removeMedia(mediaId, user.id);
  }
}
