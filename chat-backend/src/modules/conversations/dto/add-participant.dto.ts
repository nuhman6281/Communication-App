import { IsArray, IsUUID, ArrayMinSize, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@common/constants';

export class AddParticipantDto {
  @ApiProperty({
    description: 'User IDs to add',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  userIds: string[];

  @ApiProperty({
    enum: UserRole,
    description: 'Role for new participants',
    required: false,
    default: UserRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
