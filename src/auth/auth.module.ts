import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../profiles/entities/user-profile.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { ProfilesService } from '../profiles/profiles.service';
import { MailModule } from '../mail/mail.module';
import { OTP } from '../users/entities/otp.entity';
import { CommonLockModule } from '../common/common-lock.module';
import { StreaksModule } from '../streaks/streaks.module';

@Module({
  imports: [
    UsersModule,
    ProfilesModule,
    MailModule,
    CommonLockModule,
    StreaksModule,
    TypeOrmModule.forFeature([User, OTP, UserProfile]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string | number>('JWT_EXPIRES_IN', '7d') as any
        }
      })
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy,
    ProfilesService,
  ],
  exports: [
    JwtStrategy, 
    PassportModule, 
    JwtModule, 
    AuthService
  ],
})
export class AuthModule {}
