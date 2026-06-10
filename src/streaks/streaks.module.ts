import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreaksService } from './streaks.service';
import { StreaksController } from './streaks.controller';
import { UserStreak } from './entities/user-streak.entity';
import { UserProfile } from 'src/profiles/entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserStreak, UserProfile])],
  controllers: [StreaksController],
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule { }
