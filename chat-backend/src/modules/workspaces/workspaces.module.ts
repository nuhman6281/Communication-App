import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { User } from '@modules/users/entities/user.entity';
import { Group } from '@modules/groups/entities/group.entity';
import { Channel } from '@modules/channels/entities/channel.entity';
import { EmailModule } from '@modules/email/email.module';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspaceAdminGuard } from './guards/workspace-admin.guard';
import { WorkspaceOwnerGuard } from './guards/workspace-owner.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, WorkspaceMember, User, Group, Channel]),
    EmailModule,
  ],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesService,
    WorkspaceMemberGuard,
    WorkspaceAdminGuard,
    WorkspaceOwnerGuard,
  ],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
