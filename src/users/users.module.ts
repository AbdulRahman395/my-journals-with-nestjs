import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { OTP } from './entities/otp.entity';
import { OtpService } from './otp.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OTP]),
    MailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, OtpService],
  exports: [UsersService, OtpService],
})
export class UsersModule {}
