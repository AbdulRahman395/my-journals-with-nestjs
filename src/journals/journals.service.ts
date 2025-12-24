import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileUpload } from '../common/types/file.types';
import { Journal } from './entities/journal.entity';
import { JournalMedia } from './entities/journal-media.entity';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { User } from '../users/entities/user.entity';
import { paginate, createPaginationResponse } from '../common/utils/pagination.util';

@Injectable()
export class JournalsService {
  constructor(
    @InjectRepository(Journal)
    private readonly journalRepository: Repository<Journal>,
    @InjectRepository(JournalMedia)
    private readonly journalMediaRepository: Repository<JournalMedia>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createJournalDto: CreateJournalDto,
    files: FileUpload[],
    user: User,
  ) {
    try {
      // Create the journal entry
      const journal = this.journalRepository.create({
        ...createJournalDto,
        journal_date: new Date(createJournalDto.journalDate),
        user_id: user.id,
        user: user, // Set the user relation
      });
      
      const savedJournal = await this.journalRepository.save(journal);

      // Upload files to Cloudinary and save media references
      if (files && files.length > 0) {
        const mediaPromises = files.map(async (file, index) => {
          const uploadResult = await this.cloudinaryService.uploadFile({
            ...file,
            buffer: file.buffer,
          }, {
            folder: `journals/${user.id}/${savedJournal.id}`,
            public_id: `${Date.now()}_${index}`,
          });

          const media = this.journalMediaRepository.create({
            journal_id: savedJournal.id,
            url: uploadResult.secure_url,
            order: index,
          });

          return this.journalMediaRepository.save(media);
        });

        await Promise.all(mediaPromises);
      }

      // Reload the journal with relations
      return this.journalRepository.findOne({
        where: { id: savedJournal.id },
        relations: ['media'],
      });

    } catch (error) {
      console.error('Error creating journal:', error);
      throw new Error('Failed to create journal');
    }
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // First, get all journals for the user
    const allJournals = await this.journalRepository.find({
      where: { user_id: userId },
      relations: ['media'],
      order: { journal_date: 'DESC', created_at: 'DESC' },
    });

    // First, sort all journals by journal_date (DESC) and then by created_at (DESC)
    const sortedJournals = [...allJournals].sort((a, b) => {
      // Convert journal_date to timestamps for comparison
      const dateA = a.journal_date instanceof Date 
        ? a.journal_date.getTime() 
        : new Date(a.journal_date).getTime();
      
      const dateB = b.journal_date instanceof Date 
        ? b.journal_date.getTime() 
        : new Date(b.journal_date).getTime();
      
      // First sort by journal_date (DESC)
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;
      
      // If same journal_date, sort by created_at (DESC)
      return b.created_at.getTime() - a.created_at.getTime();
    });

    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedJournals = sortedJournals.slice(start, end);

    // Create pagination result
    const result = {
      data: paginatedJournals,
      pagination: {
        total: sortedJournals.length,
        page,
        limit,
        totalPages: Math.ceil(sortedJournals.length / limit),
      },
    };

    return createPaginationResponse(result);
  }

  async findOne(id: string, userId: string) {
    const journal = await this.journalRepository.findOne({
      where: { id, user_id: userId },
      relations: ['media'],
    });

    if (!journal) {
      throw new NotFoundException(`Journal with ID ${id} not found`);
    }

    return journal;
  }

  async update(
    id: string,
    updateJournalDto: UpdateJournalDto,
    files: FileUpload[],
    userId: string,
  ) {
    const journal = await this.findOne(id, userId);

    // Update journal fields
    const updatedJournal = {
      ...journal,
      ...updateJournalDto,
      journal_date: updateJournalDto.journalDate 
        ? new Date(updateJournalDto.journalDate) 
        : journal.journal_date,
    };

    // Save the updated journal
    await this.journalRepository.save(updatedJournal);

    // Handle new file uploads if any
    if (files && files.length > 0) {
      const mediaPromises = files.map(async (file, index) => {
        const uploadResult = await this.cloudinaryService.uploadFile({
          ...file,
          buffer: file.buffer,
        }, {
          folder: `journals/${userId}/${id}`,
          public_id: `${Date.now()}_${index}`,
        });

        const media = this.journalMediaRepository.create({
          journal_id: id,
          url: uploadResult.secure_url,
          order: (journal.media?.length || 0) + index,
        });

        return this.journalMediaRepository.save(media);
      });

      await Promise.all(mediaPromises);
    }

    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string) {
    const journal = await this.findOne(id, userId);
    
    // Delete associated media from Cloudinary and database
    if (journal.media && journal.media.length > 0) {
      const deletePromises = journal.media.map(media => 
        this.cloudinaryService.deleteFile(media.url.split('/').pop()?.split('.')[0] || '')
      );
      
      await Promise.all(deletePromises);
      await this.journalMediaRepository.remove(journal.media);
    }
    
    // Delete the journal
    await this.journalRepository.remove(journal);
    
    return { success: true, message: 'Journal deleted successfully' };
  }

  async removeMedia(mediaId: string, userId: string) {
    const media = await this.journalMediaRepository.findOne({
      where: { id: mediaId },
      relations: ['journal'],
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${mediaId} not found`);
    }

    // Verify that the user owns the journal this media belongs to
    if (media.journal.user_id !== userId) {
      throw new NotFoundException('Media not found');
    }

    // Delete from Cloudinary
    await this.cloudinaryService.deleteFile(media.url.split('/').pop()?.split('.')[0] || '');
    
    // Delete from database
    await this.journalMediaRepository.remove(media);
    
    return { success: true, message: 'Media deleted successfully' };
  }
}
