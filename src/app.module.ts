import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { dataSourceOptions } from './data-source';
import { JournalsModule } from './journals/journals.module';
import { JwtMiddleware } from './auth/middleware/jwt.middleware';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    UsersModule,
    AuthModule,
    JournalsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply JWT middleware to all routes except explicitly excluded ones
    consumer
      .apply(JwtMiddleware)
      .exclude(
        // Public auth endpoints
        { path: 'auth/signup', method: RequestMethod.ALL },
        { path: 'auth/login', method: RequestMethod.ALL },
        { path: 'auth/refresh', method: RequestMethod.ALL },
        { path: 'auth/forgot-password', method: RequestMethod.ALL },
        { path: 'auth/reset-password', method: RequestMethod.ALL },
        { path: 'auth/resend-otp', method: RequestMethod.ALL },
        
        // Public routes
        { path: '', method: RequestMethod.GET },
        { path: 'health', method: RequestMethod.GET },
        
        // Swagger documentation
        { path: 'api', method: RequestMethod.ALL },
        { path: 'api-json', method: RequestMethod.ALL },
        { path: 'api/(.*)', method: RequestMethod.ALL },
        
        // Public user registration and verification
        { path: 'auth/register', method: RequestMethod.ALL },
        { path: 'auth/verify-account', method: RequestMethod.ALL }
      )
      .forRoutes('*');
  }
}