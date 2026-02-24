import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtMiddleware } from '../auth/middleware/jwt.middleware';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { StreaksModule } from '../streaks/streaks.module';
import { JournalsController } from './journals.controller';
import { JournalsService } from './journals.service';
import { Journal } from './entities/journal.entity';
import { JournalMedia } from './entities/journal-media.entity';
import { EncryptionService } from '../common/services/encryption.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Journal, JournalMedia]),
    CloudinaryModule,
    StreaksModule,
  ],
  controllers: [JournalsController],
  providers: [JournalsService, JwtService, ConfigService, EncryptionService],
  exports: [JournalsService],
})
export class JournalsModule {}
