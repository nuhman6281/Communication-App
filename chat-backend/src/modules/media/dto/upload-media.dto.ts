import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadMediaDto {
  @ApiProperty({
    description: 'Message ID to associate with this media',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  messageId?: string;

  @ApiProperty({
    description: 'Folder/category for organizing media',
    required: false,
    default: 'general',
  })
  @IsOptional()
  @IsString()
  folder?: string;
}
