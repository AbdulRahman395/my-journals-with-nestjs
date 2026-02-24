import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Journal } from '../journals/entities/journal.entity';
import { UserStreak } from '../streaks/entities/user-streak.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Journal, UserStreak])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
