import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({ 
    example: true, 
    description: 'Indicates if the registration was successful' 
  })
  success: boolean;

  @ApiProperty({ 
    example: 'Verification email has been sent successfully.', 
    description: 'A message describing the result of the registration' 
  })
  message: string;
}
