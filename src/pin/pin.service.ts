import { 
  Injectable, 
  UnauthorizedException, 
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { Pin } from './entities/pin.entity';
import { CreatePinDto } from './dto/create-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Injectable()
export class PinService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly PIN_VERIFICATION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    @InjectRepository(Pin)
    private readonly pinRepository: Repository<Pin>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createPin(user: User, createPinDto: CreatePinDto): Promise<{ accessToken: string }> {
    // Convert user.id to number if it's a string
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    // Check if user already has a PIN
    const existingPin = await this.pinRepository.findOne({ 
      where: { userId } 
    });
    
    if (existingPin) {
      throw new ConflictException('PIN already exists for this user');
    }

    // Hash the PIN
    const pinHash = await this.hashPin(createPinDto.pin);
    
    // Create and save the PIN
    const pin = this.pinRepository.create({
      user,
      pinHash,
      failedAttempts: 0,
      lockedUntil: null,
    });

    await this.pinRepository.save(pin);

    // Generate a new JWT with pinVerified: true
    return this.generatePinVerifiedToken(user);
  }

  async verifyPin(user: User, verifyPinDto: VerifyPinDto): Promise<{ accessToken: string }> {
    // Convert user.id to number if it's a string
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    const pin = await this.pinRepository.findOne({ 
      where: { userId },
      relations: ['user']
    });

    if (!pin) {
      throw new NotFoundException('No PIN set for this user');
    }

    // Check if PIN is locked
    if (pin.lockedUntil && pin.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((pin.lockedUntil.getTime() - Date.now()) / 1000 / 60);
      throw new ForbiddenException(
        `Too many failed attempts. Please try again in ${remainingTime} minutes.`
      );
    }

    const isPinValid = await bcrypt.compare(verifyPinDto.pin, pin.pinHash);

    if (!isPinValid) {
      // Increment failed attempts
      pin.failedAttempts += 1;
      
      // Lock the account if max attempts reached
      if (pin.failedAttempts >= this.MAX_ATTEMPTS) {
        pin.lockedUntil = new Date(Date.now() + this.LOCK_DURATION_MS);
      }
      
      await this.pinRepository.save(pin);
      
      const remainingAttempts = this.MAX_ATTEMPTS - pin.failedAttempts;
      if (remainingAttempts > 0) {
        throw new UnauthorizedException(
          `Invalid PIN. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`
        );
      } else {
        const lockTime = Math.ceil(this.LOCK_DURATION_MS / 60000); // Convert to minutes
        throw new ForbiddenException(
          `Too many failed attempts. Your account has been locked for ${lockTime} minutes.`
        );
      }
    }

    // Reset failed attempts on successful verification
    pin.failedAttempts = 0;
    pin.lockedUntil = null;
    await this.pinRepository.save(pin);

    // Generate a new JWT with pinVerified: true
    return this.generatePinVerifiedToken(user);
  }

  async hasPin(userId: number | string): Promise<boolean> {
    // Convert userId to number if it's a string
    const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const pin = await this.pinRepository.findOne({ 
      where: { userId: id } 
    });
    return !!pin;
  }

  async getPinStatus(userId: number | string): Promise<{ hasPin: boolean; isLocked: boolean; lockedUntil: Date | null }> {
    // Convert userId to number if it's a string
    const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const pin = await this.pinRepository.findOne({ 
      where: { userId: id } 
    });
    
    if (!pin) {
      return { hasPin: false, isLocked: false, lockedUntil: null };
    }

    const isLocked = !!(pin.lockedUntil && pin.lockedUntil > new Date());
    return {
      hasPin: true,
      isLocked,
      lockedUntil: isLocked ? pin.lockedUntil : null
    };
  }

  private async hashPin(pin: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(pin, salt);
  }

  private async generatePinVerifiedToken(user: User): Promise<{ accessToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      pinVerified: true,
    };

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in the configuration');
    }

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.PIN_VERIFICATION_EXPIRY / 1000, // Convert to seconds
    });

    return { accessToken };
  }
}
