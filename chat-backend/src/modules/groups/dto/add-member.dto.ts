import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { GroupMemberRole } from '../entities/group-member.entity';

export class AddMemberDto {
  @ApiProperty({ description: 'User ID to add' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: GroupMemberRole, required: false })
  @IsOptional()
  @IsEnum(GroupMemberRole)
  role?: GroupMemberRole;
}
