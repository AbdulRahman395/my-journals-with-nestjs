import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodController } from './mood.controller';
import { MoodService } from './mood.service';
import { Journal } from '../journals/entities/journal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Journal])],
  controllers: [MoodController],
  providers: [MoodService],
  exports: [MoodService],
})
export class MoodModule {}
