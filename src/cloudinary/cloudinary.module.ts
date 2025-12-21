import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CloudinaryService, ConfigService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
