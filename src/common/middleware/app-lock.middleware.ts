import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LockPreference } from '../../lock/entities/lock.entity';
import { LockService } from '../services/lock.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    isEmailVerified: boolean;
    pinVerified: boolean;
  };
}

@Injectable()
export class AppLockMiddleware implements NestMiddleware {
  constructor(
    private readonly lockService: LockService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Skip middleware for non-authenticated routes or public routes
    const publicRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-account',
      '/auth/resend-otp',
      '/pin/create',
      '/pin/verify',
      '/pin/status',
      '/pin/has-pin',
      '/lock/preferences'
    ];

    if (publicRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Skip if user is not authenticated
    if (!req.user || !req.user.id) {
      return next();
    }

    try {
      const userId = parseInt(req.user.id, 10);
      
      const lock = await this.lockService.findByUserId(userId);

      if (!lock) {
        // If no lock record exists, create default one and allow access
        await this.lockService.createDefaultLock(userId);
        return next();
      }

      // If user has disabled locking or set to immediately, allow access
      if (lock.preferences === LockPreference.OFF || lock.preferences === LockPreference.IMMEDIATELY) {
        return next();
      }

      // Calculate time difference
      const now = new Date();
      const lastActive = lock.lastActive;
      
      if (!lastActive) {
        // If no last active recorded, set it to current time and allow access
        await this.lockService.updateLastActive(lock.id);
        return next();
      }

      const timeDiffMs = now.getTime() - lastActive.getTime();
      
      const threshold = this.lockService.getThreshold(lock.preferences);

      // If time difference exceeds user preference, block access
      if (timeDiffMs > threshold) {
        throw new HttpException('Your app is locked, please unlock first', HttpStatus.LOCKED);
      }

      // Allow access and update last active time
      await this.lockService.updateLastActive(lock.id);
      next();
    } catch (error) {
      // If it's already an HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }
      
      // For other errors, log and allow access (fail open)
      console.error('Error in AppLockMiddleware:', error);
      next();
    }
  }
}
