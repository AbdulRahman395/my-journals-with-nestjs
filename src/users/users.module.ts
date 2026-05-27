import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { OTP } from './entities/otp.entity';
import { OtpService } from './otp.service';
import { UserProfile } from '../profiles/entities/user-profile.entity';
import { Journal } from '../journals/entities/journal.entity';
import { Lock } from '../lock/entities/lock.entity';
import { Pin } from '../pin/entities/pin.entity';
import { UserStreak } from '../streaks/entities/user-streak.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OTP, UserProfile, Journal, Lock, Pin, UserStreak]),
  ],
  controllers: [UsersController],
  providers: [UsersService, OtpService],
  exports: [UsersService, OtpService],
})
export class UsersModule { }
