import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember, MemberStatus } from '../entities/workspace-member.entity';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
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

    // Check if user is a member of the workspace
    const membership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: user.id,
        status: MemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this workspace',
      );
    }

    // Attach membership to request for later use
    request.workspaceMembership = membership;

    return true;
  }
}
