import { Controller, Get, Res, HttpStatus, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Response, Request } from 'express';
import { join } from 'path';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    isEmailVerified: boolean;
    pinVerified: boolean;
  };
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@Res() res: Response) {
    res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  }

  // This API is made for Frontend to send heartbeats if the user is idle but not using the app (we don't have to lock the app just as WhatsApp)
  @Get('heartbeat')
  heartbeat(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    // Add App Lock middleware information to headers
    res.setHeader('X-App-Lock-Status', 'active');
    res.setHeader('X-App-Lock-Middleware', 'applied');
    
    if (req.user) {
      res.setHeader('X-User-Authenticated', 'true');
      res.setHeader('X-User-ID', req.user.id);
    } else {
      res.setHeader('X-User-Authenticated', 'false');
    }
    
    res.status(HttpStatus.OK).send();
  }
}
