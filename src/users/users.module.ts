import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { OTP } from './entities/otp.entity';
import { OtpService } from './otp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OTP]),
  ],
  controllers: [UsersController],
  providers: [UsersService, OtpService],
  exports: [UsersService, OtpService],
})
export class UsersModule {}
