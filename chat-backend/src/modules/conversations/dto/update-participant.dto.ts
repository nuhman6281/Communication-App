import { IsBoolean, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@common/constants';

export class UpdateParticipantDto {
  @ApiProperty({
    description: 'Mute conversation',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;

  @ApiProperty({
    description: 'Archive conversation',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiProperty({
    description: 'Pin conversation',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiProperty({
    description: 'Notification settings',
    required: false,
    example: { enabled: true, sound: true, preview: true },
  })
  @IsOptional()
  @IsObject()
  notificationSettings?: {
    enabled: boolean;
    sound: boolean;
    preview: boolean;
  };

  @ApiProperty({
    enum: UserRole,
    description: 'Update participant role (admin only)',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
