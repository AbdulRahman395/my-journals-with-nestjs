import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from '../strategies/jwt.strategy';

@Injectable()
export class PinVerifiedGuard extends AuthGuard('jwt') {
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

    // Check if PIN is verified
    if (!user.pinVerified) {
      throw new UnauthorizedException('PIN verification required');
    }

    return user as TUser;
  }
}
