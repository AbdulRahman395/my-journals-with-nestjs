import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Journal } from '../journals/entities/journal.entity';
import { StreaksModule } from '../streaks/streaks.module';

@Module({
  imports: [TypeOrmModule.forFeature([Journal]), StreaksModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
