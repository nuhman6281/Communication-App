import { IsString, IsEmail, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceRole } from '../entities/workspace-member.entity';

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address of the user to invite',
    example: 'john@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Role to assign',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
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
}

export class InviteMembersDto {
  @ApiProperty({
    description: 'List of emails to invite',
    type: [String],
    example: ['john@example.com', 'jane@example.com'],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  emails: string[];

  @ApiPropertyOptional({
    description: 'Role to assign to all invitees',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;
}

export class AddMemberDirectDto {
  @ApiProperty({
    description: 'User ID to add',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Role to assign',
    enum: WorkspaceRole,
    default: WorkspaceRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;

  @ApiPropertyOptional({
    description: 'Custom permissions',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customPermissions?: string[];
}
