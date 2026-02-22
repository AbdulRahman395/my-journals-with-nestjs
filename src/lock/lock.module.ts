import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LockService } from './lock.service';
import { LockController } from './lock.controller';
import { Lock } from './entities/lock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lock])],
  controllers: [LockController],
  providers: [LockService],
  exports: [LockService],
})
export class LockModule {}
