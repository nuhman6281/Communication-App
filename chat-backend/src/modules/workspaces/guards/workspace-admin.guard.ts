import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  WorkspaceMember,
  WorkspaceRole,
  MemberStatus,
} from '../entities/workspace-member.entity';

@Injectable()
export class WorkspaceAdminGuard implements CanActivate {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get workspace ID from params
    const workspaceId = request.params.workspaceId || request.params.id;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID not provided');
    }

    // Check if user is admin or owner
    const membership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: user.id,
        role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
        status: MemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have admin privileges in this workspace',
      );
    }

    // Attach membership to request
    request.workspaceMembership = membership;

    return true;
  }
}
