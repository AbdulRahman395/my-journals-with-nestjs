import { IsString, Length, IsNotEmpty } from 'class-validator';

export class CreatePinDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 6) // Adjust length as per your requirements
  pin: string;
}
