import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }
      
      // Attach minimal user info to the request
      req.user = {
        id: payload.sub,
        email: payload.email || '',
      };
      
      console.log('User attached to request:', req.user); // Debug log
      next();
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
