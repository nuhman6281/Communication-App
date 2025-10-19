import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MessageReactionDto {
  @ApiProperty({
    example: '👍',
    description: 'Emoji reaction',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  emoji: string;
}
