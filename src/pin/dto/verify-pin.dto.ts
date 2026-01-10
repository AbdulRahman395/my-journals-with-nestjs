import { IsString, Length, IsNotEmpty } from 'class-validator';

export class VerifyPinDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 6) // Should match the length in CreatePinDto
  pin: string;
}
