import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginResponseDto {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    isEmailVerified: boolean;
    name: string;
  };
}
