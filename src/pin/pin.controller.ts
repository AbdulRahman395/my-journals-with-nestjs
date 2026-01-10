import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Get, 
  Request, 
  HttpCode, 
  HttpStatus,
  UnauthorizedException
} from '@nestjs/common';
import { PinService } from './pin.service';
import { CreatePinDto } from './dto/create-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PinVerifiedGuard } from '../auth/guards/pin-verified.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('pin')
@Controller('pin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PinController {
  constructor(private readonly pinService: PinService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new PIN' })
  @ApiResponse({ status: 201, description: 'PIN created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'PIN already exists' })
  async create(@Request() req: any, @Body() createPinDto: CreatePinDto) {
    const result = await this.pinService.createPin(req.user, createPinDto);
    return { 
      message: 'PIN created successfully',
      accessToken: result.accessToken 
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify PIN' })
  @ApiResponse({ status: 200, description: 'PIN verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid PIN' })
  @ApiResponse({ status: 403, description: 'Account locked' })
  @ApiResponse({ status: 404, description: 'No PIN set for this user' })
  async verify(@Request() req: any, @Body() verifyPinDto: VerifyPinDto) {
    const result = await this.pinService.verifyPin(req.user, verifyPinDto);
    return { 
      message: 'PIN verified successfully',
      accessToken: result.accessToken 
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get PIN status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the PIN status including lock status',
    schema: {
      type: 'object',
      properties: {
        hasPin: { type: 'boolean' },
        isLocked: { type: 'boolean' },
        lockedUntil: { type: 'string', format: 'date-time', nullable: true }
      }
    }
  })
  async getStatus(@Request() req: any) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.pinService.getPinStatus(req.user.id);
  }

  @Get('has-pin')
  @ApiOperation({ summary: 'Check if user has a PIN set' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns whether the user has a PIN set',
    schema: {
      type: 'object',
      properties: {
        hasPin: { type: 'boolean' }
      }
    }
  })
  async hasPin(@Request() req: any) {
    if (!req.user?.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    const hasPin = await this.pinService.hasPin(req.user.id);
    return { hasPin };
  }

  // Example of a protected endpoint that requires PIN verification
  @Get('protected')
  @UseGuards(PinVerifiedGuard)
  @ApiOperation({ summary: 'Example protected endpoint' })
  @ApiResponse({ status: 200, description: 'Access granted' })
  @ApiResponse({ status: 401, description: 'PIN verification required' })
  getProtectedData() {
    return { message: 'This is protected data that requires PIN verification' };
  }
}
