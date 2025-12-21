import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtMiddleware } from '../auth/middleware/jwt.middleware';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { JournalsController } from './journals.controller';
import { JournalsService } from './journals.service';
import { Journal } from './entities/journal.entity';
import { JournalMedia } from './entities/journal-media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Journal, JournalMedia]),
    CloudinaryModule,
  ],
  controllers: [JournalsController],
  providers: [JournalsService, JwtService, ConfigService],
  exports: [JournalsService],
})
export class JournalsModule {}
