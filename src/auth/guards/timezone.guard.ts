import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request, Response, NextFunction } from 'express';
import { UserProfile } from '../../profiles/entities/user-profile.entity';

@Injectable()
export class TimezoneMiddleware implements NestMiddleware {
    constructor(
        @InjectRepository(UserProfile)
        private readonly userProfileRepository: Repository<UserProfile>,
    ) { }

    async use(req: Request, res: Response, next: NextFunction): Promise<void> {
        const timezone = req.headers['x-timezone'] as string ?? 'UTC';
        (req as any).timezone = timezone;

        const user = (req as any).user;

        if (user?.id) {
            await this.userProfileRepository.update(
                { user_id: user.id },
                { timezone },
            );
        }

        next();
    }
}