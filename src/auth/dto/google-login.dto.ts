import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoginResponseDto } from './login.dto';

export class GoogleLoginDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
    description: 'The ID token (credential) returned by Google Identity Services',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class GoogleLoginResponseDto extends LoginResponseDto {
  @ApiProperty({
    example: false,
    description: 'True when this Google sign-in created a new Notevia account',
  })
  isNewUser: boolean;
}
