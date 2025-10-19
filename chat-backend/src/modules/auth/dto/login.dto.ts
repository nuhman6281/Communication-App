import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email or username',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string; // Can be email or username

  @ApiProperty({ example: 'SecureP@ss123', description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: '123456',
    description: 'MFA code (required if MFA is enabled)',
    required: false,
  })
  @IsString()
  mfaCode?: string;
}
