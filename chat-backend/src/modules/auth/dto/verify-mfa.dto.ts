import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyMfaDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit MFA code',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
