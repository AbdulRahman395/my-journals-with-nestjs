import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PinService } from './pin.service';
import { PinController } from './pin.controller';
import { Pin } from './entities/pin.entity';
import { UsersModule } from '../users/users.module';
import { CommonLockModule } from '../common/common-lock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pin]),
    UsersModule,
    CommonLockModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '10m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PinController],
  providers: [PinService],
  exports: [PinService, JwtModule],
})
export class PinModule {}
