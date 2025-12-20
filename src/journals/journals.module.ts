import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journal } from './entities/journal.entity';
import { JournalMedia } from './entities/journal-media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Journal, JournalMedia])],
  exports: [TypeOrmModule],
})
export class JournalsModule {}
