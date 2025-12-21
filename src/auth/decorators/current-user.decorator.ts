import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUser } from '../types/auth.types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user) {
      console.error('No user found in request');
      throw new UnauthorizedException('User not found in request');
    }
    return request.user;
  },
);
