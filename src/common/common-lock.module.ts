import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lock } from '../lock/entities/lock.entity';
import { LockService } from './services/lock.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lock])],
  providers: [LockService],
  exports: [LockService],
})
export class CommonLockModule {}
