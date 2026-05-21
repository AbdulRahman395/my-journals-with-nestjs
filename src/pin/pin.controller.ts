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
import { ChangePinDto, ChangePinResponseDto } from './dto/change-pin.dto';
import { ForgetPinDto, ResetPinDto, ForgetPinResponseDto, ResetPinResponseDto } from './dto/forget-pin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PinVerifiedGuard } from '../auth/guards/pin-verified.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';

@ApiTags('pin')
@Controller('pin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PinController {
  constructor(private readonly pinService: PinService) { }

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

  @Post('change-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Change user PIN',
    description: `Changes the PIN for the authenticated user.
    
**Note:** Requires a valid JWT token in the Authorization header and current PIN verification.`,
    security: [{ bearerAuth: [] }]
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PIN has been changed successfully',
    type: ChangePinResponseDto,
    content: {
      'application/json': {
        examples: {
          success: {
            summary: 'PIN changed successfully',
            value: {
              success: true,
              message: 'Your PIN has been changed successfully.'
            }
          },
          invalidCurrentPin: {
            summary: 'Incorrect current PIN',
            value: {
              success: false,
              message: 'Current PIN is incorrect'
            }
          },
          samePinAsNew: {
            summary: 'New PIN same as current',
            value: {
              success: false,
              message: 'New PIN cannot be the same as the current PIN'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request body or validation failed',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No PIN set for this user',
  })
  @ApiBody({ 
    type: ChangePinDto,
    examples: {
      validRequest: {
        summary: 'Valid PIN change request',
        value: {
          currentPin: '1234',
          newPin: '5678',
        }
      }
    }
  })
  async changePin(
    @Request() req: any,
    @Body() changePinDto: ChangePinDto,
  ): Promise<ChangePinResponseDto> {
    return this.pinService.changePin(req.user, changePinDto);
  }

  @Post('forget-pin')
  @HttpCode(HttpStatus.OK)
  @UseGuards()
  @ApiOperation({ 
    summary: 'Request PIN reset', 
    description: `Initiates the PIN reset process by sending a reset OTP to the provided email address.
    
**Note:** For security reasons, this endpoint will always return a success response (200) even if the email doesn't exist in our system.`
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PIN reset email has been sent if the account exists',
    type: ForgetPinResponseDto,
    content: {
      'application/json': {
        examples: {
          success: {
            summary: 'PIN reset email sent',
            value: {
              success: true,
              message: 'If your email is registered, a PIN reset OTP has been sent to your email.'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email format or missing required fields',
  })
  @ApiBody({ 
    type: ForgetPinDto,
    examples: {
      validEmail: {
        summary: 'Valid email request',
        value: {
          email: 'user@example.com'
        }
      }
    }
  })
  async forgetPin(
    @Body() forgetPinDto: ForgetPinDto,
  ): Promise<ForgetPinResponseDto> {
    return this.pinService.forgetPin(forgetPinDto);
  }

  @Post('reset-pin')
  @HttpCode(HttpStatus.OK)
  @UseGuards()
  @ApiOperation({
    summary: 'Reset PIN',
    description: `Resets the user's PIN using the OTP sent to their email.
    
**Note:** The OTP is valid for a limited time only.`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PIN has been reset successfully',
    type: ResetPinResponseDto,
    content: {
      'application/json': {
        examples: {
          success: {
            summary: 'PIN reset successful',
            value: {
              success: true,
              message: 'Your PIN has been reset successfully'
            }
          },
          invalidOtp: {
            summary: 'Invalid OTP',
            value: {
              success: false,
              message: 'Invalid or expired OTP. Please request a new one.'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request body or OTP format',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No account found with the provided email',
  })
  @ApiBody({ 
    type: ResetPinDto,
    examples: {
      validRequest: {
        summary: 'Valid reset PIN request',
        value: {
          email: 'user@example.com',
          otp: '123456',
          newPin: '5678'
        }
      }
    }
  })
  async resetPin(
    @Body() resetPinDto: ResetPinDto,
  ): Promise<ResetPinResponseDto> {
    return this.pinService.resetPin(resetPinDto);
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
