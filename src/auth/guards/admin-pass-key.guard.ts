import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminPassKeyGuard implements CanActivate {
    constructor(private configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const adminPassKey = request.query.adminPassKey;
        const envAdminPassKey = this.configService.get<string>('ADMIN_PASS_KEY');

        if (!adminPassKey) {
            throw new BadRequestException('adminPassKey query parameter is required');
        }

        if (adminPassKey !== envAdminPassKey) {
            throw new UnauthorizedException('Invalid admin pass key');
        }

        return true;
    }
}
