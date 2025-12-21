import { ApiProperty } from '@nestjs/swagger';
import { Journal } from '../entities/journal.entity';
import { JournalMedia } from '../entities/journal-media.entity';

export class JournalMediaResponseDto {
  @ApiProperty({ description: 'Unique identifier of the media' })
  id: string;

  @ApiProperty({ description: 'URL of the uploaded media file' })
  url: string;

  @ApiProperty({ description: 'Order of the media in the journal entry' })
  order: number;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  constructor(media: JournalMedia) {
    this.id = media.id;
    this.url = media.url;
    this.order = media.order;
    this.created_at = media.created_at;
  }
}

export class JournalResponseDto {
  @ApiProperty({ description: 'Unique identifier of the journal entry' })
  id: string;

  @ApiProperty({ description: 'Title of the journal entry' })
  title: string | null;

  @ApiProperty({ description: 'Content of the journal entry' })
  content: string | null;

  @ApiProperty({ description: 'Date of the journal entry' })
  journal_date: Date;

  @ApiProperty({ description: 'Additional metadata for the journal entry' })
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;

  @ApiProperty({ 
    description: 'List of media files associated with the journal entry',
    type: [JournalMediaResponseDto],
  })
  media: JournalMediaResponseDto[];

  constructor(journal: Journal) {
    this.id = journal.id;
    this.title = journal.title;
    this.content = journal.content;
    this.journal_date = journal.journal_date;
    this.metadata = journal.metadata;
    this.created_at = journal.created_at;
    this.updated_at = journal.updated_at;
    this.media = journal.media
      ? journal.media.map(media => new JournalMediaResponseDto(media))
      : [];
  }
}
