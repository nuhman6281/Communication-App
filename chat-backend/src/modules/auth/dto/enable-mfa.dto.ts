import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class EnableMfaDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit MFA verification code from authenticator app',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
