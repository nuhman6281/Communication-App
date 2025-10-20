import { IsEnum, IsOptional, IsArray, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole, MemberStatus } from '../entities/workspace-member.entity';

export class UpdateMemberRoleDto {
  @ApiPropertyOptional({
    description: 'New role for the member',
    enum: WorkspaceRole,
  })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;

  @ApiPropertyOptional({
    description: 'Custom permissions',
    type: [String],
    example: ['manage_channels', 'invite_members'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customPermissions?: string[];

  @ApiPropertyOptional({
    description: 'Member status',
    enum: MemberStatus,
  })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;
}
