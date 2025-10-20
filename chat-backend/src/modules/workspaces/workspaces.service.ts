import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { randomBytes } from 'crypto';
import { Workspace } from './entities/workspace.entity';
import {
  WorkspaceMember,
  WorkspaceRole,
  MemberStatus,
} from './entities/workspace-member.entity';
import { User } from '@modules/users/entities/user.entity';
import { Group } from '@modules/groups/entities/group.entity';
import { Channel } from '@modules/channels/entities/channel.entity';
import { EmailService } from '@modules/email/email.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { InviteMemberDto, AddMemberDirectDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { GetWorkspacesDto } from './dto/get-workspaces.dto';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    private readonly emailService: EmailService,
  ) {}

  // ========================================
  // WORKSPACE CRUD OPERATIONS
  // ========================================

  /**
   * Create a new workspace
   * User becomes the owner automatically
   */
  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if slug is already taken
    const existingWorkspace = await this.workspaceRepository.findOne({
      where: { slug: dto.slug },
    });

    if (existingWorkspace) {
      throw new ConflictException('Workspace slug is already taken');
    }

    // Create workspace
    const workspace = this.workspaceRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description || null,
      logoUrl: dto.logoUrl || null,
      bannerUrl: dto.bannerUrl || null,
      ownerId: userId,
      settings: dto.settings || {},
      memberCount: 1, // Owner is first member
    });

    await this.workspaceRepository.save(workspace);

    // Add owner as first member
    const ownerMembership = this.workspaceMemberRepository.create({
      workspaceId: workspace.id,
      userId: userId,
      role: WorkspaceRole.OWNER,
      status: MemberStatus.ACTIVE,
      joinedAt: new Date(),
      customPermissions: [],
    });

    await this.workspaceMemberRepository.save(ownerMembership);

    this.logger.log(
      `Workspace created: ${workspace.slug} by user ${user.username}`,
    );

    // Return workspace with owner membership
    workspace.currentUserMembership = ownerMembership;
    workspace.currentUserRole = WorkspaceRole.OWNER;

    return workspace;
  }

  /**
   * Get all workspaces for a user with pagination
   */
  async getUserWorkspaces(userId: string, query: GetWorkspacesDto) {
    const { page = 1, limit = 20, isActive, onlyOwned } = query;

    const queryBuilder = this.workspaceRepository
      .createQueryBuilder('workspace')
      .innerJoin(
        'workspace.members',
        'member',
        'member.userId = :userId AND member.status = :status',
        { userId, status: MemberStatus.ACTIVE },
      )
      .leftJoinAndSelect('workspace.owner', 'owner')
      .addSelect([
        'member.id',
        'member.role',
        'member.customPermissions',
        'member.joinedAt',
        'member.lastSeenAt',
      ]);

    // Apply filters
    if (isActive !== undefined) {
      queryBuilder.andWhere('workspace.isActive = :isActive', { isActive });
    }

    if (onlyOwned) {
      queryBuilder.andWhere('workspace.ownerId = :userId', { userId });
    }

    // Order by most recently joined
    queryBuilder.orderBy('member.joinedAt', 'DESC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [workspaces, total] = await queryBuilder.getManyAndCount();

    // Attach current user membership to each workspace
    workspaces.forEach((workspace) => {
      const membership = (workspace.members || [])[0];
      workspace.currentUserMembership = membership;
      workspace.currentUserRole = membership?.role;
    });

    return {
      workspaces,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get workspace by ID with member verification
   */
  async getWorkspaceById(userId: string, workspaceId: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['owner'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Verify user is a member
    const membership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId,
        status: MemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Attach membership info
    workspace.currentUserMembership = membership;
    workspace.currentUserRole = membership.role;

    return workspace;
  }

  /**
   * Update workspace details (admin/owner only)
   */
  async updateWorkspace(
    userId: string,
    workspaceId: string,
    dto: UpdateWorkspaceDto,
  ) {
    // Verify user is admin or owner
    const membership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId,
        role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
        status: MemberStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have permission to update this workspace',
      );
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Update workspace fields
    if (dto.name) workspace.name = dto.name;
    if (dto.description !== undefined) workspace.description = dto.description;
    if (dto.logoUrl !== undefined) workspace.logoUrl = dto.logoUrl;
    if (dto.bannerUrl !== undefined) workspace.bannerUrl = dto.bannerUrl;
    if (dto.settings) {
      workspace.settings = { ...workspace.settings, ...dto.settings };
    }

    // Only owner can change active status
    if (dto.isActive !== undefined) {
      if (membership.role !== WorkspaceRole.OWNER) {
        throw new ForbiddenException('Only workspace owner can change active status');
      }
      workspace.isActive = dto.isActive;
    }

    await this.workspaceRepository.save(workspace);

    this.logger.log(`Workspace updated: ${workspace.slug} by user ${userId}`);

    workspace.currentUserMembership = membership;
    workspace.currentUserRole = membership.role;

    return workspace;
  }

  /**
   * Delete workspace (owner only)
   */
  async deleteWorkspace(userId: string, workspaceId: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Verify user is owner
    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only workspace owner can delete the workspace');
    }

    // Check if workspace has active channels or groups
    if (workspace.channelCount > 0 || workspace.groupCount > 0) {
      throw new BadRequestException(
        'Cannot delete workspace with active channels or groups. Please remove them first.',
      );
    }

    await this.workspaceRepository.remove(workspace);

    this.logger.log(`Workspace deleted: ${workspace.slug} by user ${userId}`);

    return { message: 'Workspace deleted successfully' };
  }

  // ========================================
  // MEMBER MANAGEMENT
  // ========================================

  /**
   * Get workspace members with pagination
   */
  async getWorkspaceMembers(
    workspaceId: string,
    userId: string,
    options: { page?: number; limit?: number; role?: WorkspaceRole; status?: MemberStatus } = {},
  ) {
    // Verify requester is a member
    const requesterMembership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId, status: MemberStatus.ACTIVE },
    });

    if (!requesterMembership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Ensure page and limit are numbers with defaults
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 50;
    const { role, status } = options;

    const queryBuilder = this.workspaceMemberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('member.invitedBy', 'inviter')
      .where('member.workspaceId = :workspaceId', { workspaceId });

    // Apply filters
    if (role) {
      queryBuilder.andWhere('member.role = :role', { role });
    }
    if (status) {
      queryBuilder.andWhere('member.status = :status', { status });
    }

    // Order: Just use joinedAt for now, we'll sort by role in memory
    queryBuilder.orderBy('member.joinedAt', 'ASC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [members, total] = await queryBuilder.getManyAndCount();

    // Sort by role hierarchy in memory
    const roleOrder: Record<WorkspaceRole, number> = {
      [WorkspaceRole.OWNER]: 1,
      [WorkspaceRole.ADMIN]: 2,
      [WorkspaceRole.MODERATOR]: 3,
      [WorkspaceRole.MEMBER]: 4,
      [WorkspaceRole.GUEST]: 5,
    };

    members.sort((a, b) => {
      const aOrder = roleOrder[a.role] || 6;
      const bOrder = roleOrder[b.role] || 6;
      if (aOrder !== bOrder) return aOrder - bOrder;
      // If same role, sort by join date
      const aTime = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
      const bTime = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
      return aTime - bTime;
    });

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Invite member by email
   * Sends invitation email if user exists, creates pending invitation otherwise
   */
  async inviteMemberByEmail(
    workspaceId: string,
    inviterId: string,
    dto: InviteMemberDto,
  ) {
    // Verify inviter has permission (admin or owner)
    const inviterMembership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: inviterId,
        role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
        status: MemberStatus.ACTIVE,
      },
    });

    if (!inviterMembership) {
      throw new ForbiddenException('You do not have permission to invite members');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Find user by email
    const invitedUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!invitedUser) {
      throw new NotFoundException(
        'User with this email does not exist. They need to create an account first.',
      );
    }

    // Check if user is already a member
    const existingMembership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId: invitedUser.id },
    });

    if (existingMembership) {
      if (existingMembership.status === MemberStatus.ACTIVE) {
        throw new ConflictException('User is already a member of this workspace');
      } else if (existingMembership.status === MemberStatus.INVITED) {
        throw new ConflictException('User has already been invited to this workspace');
      } else if (existingMembership.status === MemberStatus.SUSPENDED) {
        throw new BadRequestException('User is suspended from this workspace');
      }
    }

    // Check workspace member limit
    if (workspace.settings.maxMembers && workspace.memberCount >= workspace.settings.maxMembers) {
      throw new BadRequestException('Workspace has reached maximum member limit');
    }

    // Cannot assign owner role via invitation
    if (dto.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Cannot assign owner role via invitation');
    }

    // Create invitation
    const invitation = this.workspaceMemberRepository.create({
      workspaceId,
      userId: invitedUser.id,
      role: dto.role || WorkspaceRole.MEMBER,
      customPermissions: dto.customPermissions || [],
      status: MemberStatus.INVITED,
      invitedById: inviterId,
      invitedAt: new Date(),
    });

    await this.workspaceMemberRepository.save(invitation);

    // Send invitation email
    await this.sendWorkspaceInvitationEmail(invitedUser, workspace, inviterMembership.user);

    this.logger.log(
      `User ${invitedUser.email} invited to workspace ${workspace.slug} by ${inviterId}`,
    );

    return {
      message: 'Invitation sent successfully',
      invitation,
    };
  }

  /**
   * Add member directly (without email invitation)
   */
  async addMemberDirect(
    workspaceId: string,
    adminId: string,
    dto: AddMemberDirectDto,
  ) {
    // Verify admin has permission
    const adminMembership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: adminId,
        role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
        status: MemberStatus.ACTIVE,
      },
    });

    if (!adminMembership) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already member
    const existingMembership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId: dto.userId },
    });

    if (existingMembership?.status === MemberStatus.ACTIVE) {
      throw new ConflictException('User is already a member');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Check member limit
    if (workspace.settings.maxMembers && workspace.memberCount >= workspace.settings.maxMembers) {
      throw new BadRequestException('Workspace has reached maximum member limit');
    }

    // Cannot assign owner role
    if (dto.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Cannot assign owner role directly');
    }

    // Add member
    const membership = this.workspaceMemberRepository.create({
      workspaceId,
      userId: dto.userId,
      role: dto.role || WorkspaceRole.MEMBER,
      customPermissions: dto.customPermissions || [],
      status: MemberStatus.ACTIVE,
      invitedById: adminId,
      joinedAt: new Date(),
    });

    await this.workspaceMemberRepository.save(membership);

    // Increment member count
    await this.workspaceRepository.increment({ id: workspaceId }, 'memberCount', 1);

    this.logger.log(`User ${dto.userId} added to workspace ${workspaceId} by ${adminId}`);

    return membership;
  }

  /**
   * Update member role and permissions
   */
  async updateMemberRole(
    workspaceId: string,
    adminId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    // Verify admin has permission
    const adminMembership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: adminId,
        role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
        status: MemberStatus.ACTIVE,
      },
    });

    if (!adminMembership) {
      throw new ForbiddenException('You do not have permission to update member roles');
    }

    // Get target member
    const targetMembership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId: targetUserId },
    });

    if (!targetMembership) {
      throw new NotFoundException('Member not found');
    }

    // Cannot modify workspace owner
    if (targetMembership.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot modify workspace owner role');
    }

    // Cannot assign owner role (must use transfer ownership)
    if (dto.role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Cannot assign owner role. Use transfer ownership instead.');
    }

    // Admin cannot promote to admin or modify other admins (only owner can)
    if (adminMembership.role === WorkspaceRole.ADMIN) {
      if (dto.role === WorkspaceRole.ADMIN || targetMembership.role === WorkspaceRole.ADMIN) {
        throw new ForbiddenException('Only workspace owner can manage admin roles');
      }
    }

    // Update fields
    if (dto.role) targetMembership.role = dto.role;
    if (dto.customPermissions) targetMembership.customPermissions = dto.customPermissions;
    if (dto.status) targetMembership.status = dto.status;

    await this.workspaceMemberRepository.save(targetMembership);

    this.logger.log(
      `Member ${targetUserId} role updated in workspace ${workspaceId} by ${adminId}`,
    );

    return targetMembership;
  }

  /**
   * Remove member from workspace
   */
  async removeMember(
    workspaceId: string,
    adminId: string,
    targetUserId: string,
  ) {
    // Verify admin has permission
    const adminMembership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: adminId,
        role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
        status: MemberStatus.ACTIVE,
      },
    });

    if (!adminMembership) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    // Get target member
    const targetMembership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId: targetUserId },
    });

    if (!targetMembership) {
      throw new NotFoundException('Member not found');
    }

    // Cannot remove workspace owner
    if (targetMembership.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot remove workspace owner');
    }

    // Admin cannot remove other admins (only owner can)
    if (
      adminMembership.role === WorkspaceRole.ADMIN &&
      targetMembership.role === WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException('Only workspace owner can remove admins');
    }

    // Remove member
    await this.workspaceMemberRepository.remove(targetMembership);

    // Decrement member count
    await this.workspaceRepository.decrement({ id: workspaceId }, 'memberCount', 1);

    this.logger.log(
      `Member ${targetUserId} removed from workspace ${workspaceId} by ${adminId}`,
    );

    return { message: 'Member removed successfully' };
  }

  /**
   * Leave workspace (member voluntarily leaves)
   */
  async leaveWorkspace(workspaceId: string, userId: string) {
    const membership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this workspace');
    }

    // Owner cannot leave (must transfer ownership or delete workspace)
    if (membership.role === WorkspaceRole.OWNER) {
      throw new BadRequestException(
        'Workspace owner cannot leave. Please transfer ownership or delete the workspace.',
      );
    }

    // Update status to LEFT instead of removing
    membership.status = MemberStatus.LEFT;
    await this.workspaceMemberRepository.save(membership);

    // Decrement member count
    await this.workspaceRepository.decrement({ id: workspaceId }, 'memberCount', 1);

    this.logger.log(`User ${userId} left workspace ${workspaceId}`);

    return { message: 'You have left the workspace' };
  }

  // ========================================
  // INVITATION MANAGEMENT
  // ========================================

  /**
   * Generate shareable invite link
   */
  async generateInviteLink(workspaceId: string, adminId: string): Promise<{
    inviteCode: string;
    inviteUrl: string;
    workspaceId: string;
    workspaceName: string;
  }> {
    // Verify admin permission
    const adminMembership = await this.workspaceMemberRepository.findOne({
      where: {
        workspaceId,
        userId: adminId,
        role: In([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]),
        status: MemberStatus.ACTIVE,
      },
    });

    if (!adminMembership) {
      throw new ForbiddenException('You do not have permission to generate invite links');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Generate unique invite code
    const inviteCode = this.generateInviteCode();

    // Check if code already exists (very unlikely but possible)
    const existingCode = await this.workspaceMemberRepository.findOne({
      where: { inviteCode },
    });

    if (existingCode) {
      // Regenerate if collision
      return this.generateInviteLink(workspaceId, adminId);
    }

    this.logger.log(`Invite link generated for workspace ${workspace.slug}`);

    return {
      inviteCode,
      inviteUrl: `${process.env.FRONTEND_URL}/workspaces/join/${inviteCode}`,
      workspaceId,
      workspaceName: workspace.name,
    };
  }

  /**
   * Join workspace by invite code
   */
  async joinByInviteCode(userId: string, inviteCode: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find workspace by checking if invite code exists in any workspace
    // For public invite links, we'll store the code in workspace settings
    // For now, let's find by checking workspace members or create a separate invites table
    // Simplified approach: Use a format like workspace-id:random-code

    // For this implementation, let's decode the invite code
    // Format: base64(workspaceId:timestamp:randomBytes)
    let workspaceId: string;
    try {
      const decoded = Buffer.from(inviteCode, 'base64').toString('utf-8');
      workspaceId = decoded.split(':')[0];
    } catch (error) {
      throw new BadRequestException('Invalid invite code');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId, isActive: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or invite is invalid');
    }

    // Check if already member
    const existingMembership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (existingMembership?.status === MemberStatus.ACTIVE) {
      throw new ConflictException('You are already a member of this workspace');
    }

    // Check member limit
    if (workspace.settings.maxMembers && workspace.memberCount >= workspace.settings.maxMembers) {
      throw new BadRequestException('Workspace has reached maximum member limit');
    }

    // Check if guest invites are allowed
    if (!workspace.settings.allowGuestInvites) {
      throw new ForbiddenException('This workspace does not allow guest invitations');
    }

    // Add member
    const membership = this.workspaceMemberRepository.create({
      workspaceId,
      userId,
      role: WorkspaceRole.MEMBER,
      status: MemberStatus.ACTIVE,
      joinedAt: new Date(),
      customPermissions: workspace.settings.defaultMemberPermissions || [],
    });

    await this.workspaceMemberRepository.save(membership);

    // Increment member count
    await this.workspaceRepository.increment({ id: workspaceId }, 'memberCount', 1);

    this.logger.log(`User ${userId} joined workspace ${workspace.slug} via invite code`);

    return {
      message: 'Successfully joined workspace',
      workspace,
      membership,
    };
  }

  // ========================================
  // PERMISSION HELPERS
  // ========================================

  /**
   * Check if user has a specific permission in workspace
   */
  async checkMemberPermission(
    workspaceId: string,
    userId: string,
    permission: string,
  ): Promise<boolean> {
    const membership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId, status: MemberStatus.ACTIVE },
    });

    if (!membership) {
      return false;
    }

    // Owner and admin have all permissions
    if ([WorkspaceRole.OWNER, WorkspaceRole.ADMIN].includes(membership.role)) {
      return true;
    }

    // Check custom permissions
    return membership.customPermissions.includes(permission);
  }

  /**
   * Get user's role in workspace
   */
  async getMemberRole(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceRole | null> {
    const membership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId, status: MemberStatus.ACTIVE },
      select: ['role'],
    });

    return membership?.role || null;
  }

  // ========================================
  // WORKSPACE RESOURCES
  // ========================================

  /**
   * Get workspace groups
   */
  async getWorkspaceGroups(
    workspaceId: string,
    userId: string,
    options: { page?: number; limit?: number } = {},
  ) {
    // Verify user is member
    const membership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId, status: MemberStatus.ACTIVE },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Ensure page and limit are numbers with defaults
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 50;

    const queryBuilder = this.groupRepository
      .createQueryBuilder('group')
      .where('group.workspaceId = :workspaceId', { workspaceId })
      .andWhere('group.isWorkspaceOwned = :isWorkspaceOwned', { isWorkspaceOwned: true })
      .andWhere('group.isActive = :isActive', { isActive: true })
      .leftJoinAndSelect('group.createdBy', 'createdBy')
      .orderBy('group.createdAt', 'DESC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [groups, total] = await queryBuilder.getManyAndCount();

    return {
      groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get workspace channels
   */
  async getWorkspaceChannels(
    workspaceId: string,
    userId: string,
    options: { page?: number; limit?: number } = {},
  ) {
    // Verify user is member
    const membership = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId, status: MemberStatus.ACTIVE },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Ensure page and limit are numbers with defaults
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 50;

    const queryBuilder = this.channelRepository
      .createQueryBuilder('channel')
      .where('channel.workspaceId = :workspaceId', { workspaceId })
      .andWhere('channel.isWorkspaceOwned = :isWorkspaceOwned', { isWorkspaceOwned: true })
      .andWhere('channel.isActive = :isActive', { isActive: true })
      .orderBy('channel.createdAt', 'DESC');

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [channels, total] = await queryBuilder.getManyAndCount();

    return {
      channels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Generate unique invite code
   */
  private generateInviteCode(): string {
    const workspaceBytes = randomBytes(8);
    const timestamp = Date.now().toString(36);
    const randomPart = workspaceBytes.toString('hex');

    // Format: timestamp-random (URL-safe)
    return `${timestamp}-${randomPart}`;
  }

  /**
   * Send workspace invitation email
   */
  private async sendWorkspaceInvitationEmail(
    invitedUser: User,
    workspace: Workspace,
    inviter: User,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const inviteUrl = `${frontendUrl}/workspaces/${workspace.id}/accept-invite`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .workspace-info { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Workspace Invitation 🎯</h1>
            </div>
            <div class="content">
              <p>Hi ${invitedUser.firstName || invitedUser.username},</p>
              <p><strong>${inviter.firstName || inviter.username}</strong> has invited you to join a workspace on ChatApp!</p>
              <div class="workspace-info">
                <h3>${workspace.name}</h3>
                <p>${workspace.description || 'Collaborate with your team in this workspace.'}</p>
              </div>
              <p style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${inviteUrl}</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ChatApp. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Workspace Invitation

      Hi ${invitedUser.firstName || invitedUser.username},

      ${inviter.firstName || inviter.username} has invited you to join "${workspace.name}" on ChatApp!

      ${workspace.description || ''}

      Accept invitation: ${inviteUrl}
    `;

    try {
      await this.emailService.sendEmail({
        to: invitedUser.email,
        subject: `You're invited to join ${workspace.name}`,
        html,
        text,
      });
    } catch (error) {
      this.logger.error(`Failed to send workspace invitation email: ${error.message}`);
      // Don't throw error - invitation is created, email is optional
    }
  }
}
