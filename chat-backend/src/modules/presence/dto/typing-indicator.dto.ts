import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsBoolean } from 'class-validator';

export class TypingIndicatorDto {
  @ApiProperty({
    description: 'Conversation ID where user is typing',
  })
  @IsUUID()
  conversationId: string;

  @ApiProperty({
    description: 'Whether user is currently typing',
  })
  @IsBoolean()
  isTyping: boolean;
}
