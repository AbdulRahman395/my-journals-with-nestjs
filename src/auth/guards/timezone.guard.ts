import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Request, Response, NextFunction } from 'express';
import { UserProfile } from '../../profiles/entities/user-profile.entity';

/** True when the value is a real IANA timezone, e.g. "Asia/Karachi". */
const isValidTimezone = (value: string): boolean => {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value });
        return true;
    } catch {
        return false;
    }
};

@Injectable()
export class TimezoneMiddleware implements NestMiddleware {
    constructor(
        @InjectRepository(UserProfile)
        private readonly userProfileRepository: Repository<UserProfile>,
    ) { }

    async use(req: Request, res: Response, next: NextFunction): Promise<void> {
        const header = req.headers['x-timezone'];
        const timezone = typeof header === 'string' ? header.trim() : '';
        const user = (req as any).user;

        // Only save a timezone the client actually sent. A missing or invalid header
        // must never overwrite the saved one: falling back to UTC here used to shift
        // "today" for streaks by several hours and could reset a user's streak.
        if (timezone && isValidTimezone(timezone)) {
            (req as any).timezone = timezone;

            if (user?.id) {
                // Skip the write when nothing changed
                await this.userProfileRepository.update(
                    { user_id: user.id, timezone: Not(timezone) },
                    { timezone },
                );
            }
        }

        next();
    }
}
