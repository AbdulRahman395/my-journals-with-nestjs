import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  private readonly ADMIN_SECRET_PIN = '123456'; // Hardcoded secret pin

  canActivate(context: ExecutionContext) {
    // First, run the JWT validation
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    const request = context.switchToHttp().getRequest();
    const adminPin = request.query.adminPin;

    // Check if admin pin is provided and matches the secret
    if (!adminPin || adminPin !== this.ADMIN_SECRET_PIN) {
      throw new UnauthorizedException('Invalid or missing admin pin');
    }

    return user as TUser;
  }
}
