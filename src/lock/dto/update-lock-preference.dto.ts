import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { LockPreference } from '../entities/lock.entity';

export class UpdateLockPreferenceDto {
  @IsEnum(LockPreference, {
    message: 'Preferences must be one of: immediately, 1 min, 5 min, 10 min, 30 min, off'
  })
  @IsNotEmpty({ message: 'Preferences cannot be empty' })
  preferences: LockPreference;

  @IsOptional()
  lastActive?: Date;
}
