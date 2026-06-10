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
import { AppLockMiddleware } from './common/middleware/app-lock.middleware';
import { JwtService } from '@nestjs/jwt';
import { PinModule } from './pin/pin.module';
import { ProfilesModule } from './profiles/profiles.module';
import { LockModule } from './lock/lock.module';
import { CommonLockModule } from './common/common-lock.module';
import { StreaksModule } from './streaks/streaks.module';
import { MoodModule } from './mood/mood.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TimezoneMiddleware } from './auth/guards/timezone.guard';
import { UserProfile } from './profiles/entities/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfile]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    UsersModule,
    AuthModule,
    JournalsModule,
    PinModule,
    ProfilesModule,
    LockModule,
    CommonLockModule,
    StreaksModule,
    MoodModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply JWT middleware first to authenticate requests
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
        { path: 'auth/verify-account', method: RequestMethod.ALL },

        // Admin-only endpoints (use admin pass key guard instead)
        { path: 'users', method: RequestMethod.GET },
        { path: 'users/:id', method: RequestMethod.DELETE }
      )
      .forRoutes('*');

    // Apply AppLockMiddleware after JWT middleware for authenticated routes
    consumer
      .apply(AppLockMiddleware)
      .exclude(
        // Public auth endpoints
        { path: 'auth/signup', method: RequestMethod.ALL },
        { path: 'auth/login', method: RequestMethod.ALL },
        { path: 'auth/refresh', method: RequestMethod.ALL },
        { path: 'auth/forgot-password', method: RequestMethod.ALL },
        { path: 'auth/reset-password', method: RequestMethod.ALL },
        { path: 'auth/resend-otp', method: RequestMethod.ALL },
        { path: 'auth/verify-account', method: RequestMethod.ALL },

        // Lock preferences
        { path: 'lock/preferences', method: RequestMethod.ALL },

        // PIN-related endpoints (need to be accessible for unlocking)
        { path: 'pin/create', method: RequestMethod.ALL },
        { path: 'pin/verify', method: RequestMethod.ALL },
        { path: 'pin/status', method: RequestMethod.ALL },
        { path: 'pin/has-pin', method: RequestMethod.ALL },
        { path: 'pin/protected', method: RequestMethod.ALL },

        // Public routes
        { path: '', method: RequestMethod.GET },
        { path: 'health', method: RequestMethod.GET },

        // Swagger documentation
        { path: 'api', method: RequestMethod.ALL },
        { path: 'api-json', method: RequestMethod.ALL },
        { path: 'api/(.*)', method: RequestMethod.ALL }
      )
      .forRoutes('*');
    consumer
      .apply(TimezoneMiddleware)
      .forRoutes('*'); // No exclusions needed — it never throws error
  }
}