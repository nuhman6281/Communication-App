import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Group, GroupType, GroupPrivacy } from './entities/group.entity';
import {
  GroupMember,
  GroupMemberRole,
  GroupMemberStatus,
} from './entities/group-member.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { ConversationsService } from '@modules/conversations/conversations.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    private readonly conversationsService: ConversationsService,
  ) {}

  async createGroup(
    userId: string,
    createGroupDto: CreateGroupDto,
  ): Promise<Group> {
    // Validate max members
    if (createGroupDto.maxMembers && createGroupDto.maxMembers < 2) {
      throw new BadRequestException('Group must allow at least 2 members');
    }

    // Create conversation for the group with initial members
    const initialParticipants = createGroupDto.memberIds || [];
    const conversation = await this.conversationsService.createConversation(
      userId,
      {
        name: createGroupDto.name,
        type: 'group',
        participantIds: initialParticipants, // Initial members besides creator
      },
    );

    // Create the group
    const group = this.groupRepository.create({
      name: createGroupDto.name,
      description: createGroupDto.description,
      type: createGroupDto.type || GroupType.PRIVATE,
      privacy: createGroupDto.privacy || GroupPrivacy.INVITE_ONLY,
      conversationId: conversation.id,
      maxMembers: createGroupDto.maxMembers || 256,
      memberCount: 1,
      settings: createGroupDto.settings || {
        allowMemberInvites: false,
        allowMemberPosts: true,
        allowMemberMedia: true,
        moderationEnabled: false,
      },
      tags: createGroupDto.tags || [],
      category: createGroupDto.category,
    });

    const savedGroup = await this.groupRepository.save(group);

    // Add creator as owner
    await this.groupMemberRepository.save({
      groupId: savedGroup.id,
      userId,
      role: GroupMemberRole.OWNER,
      status: GroupMemberStatus.ACTIVE,
      joinedAt: new Date(),
      permissions: {
        canPostMessages: true,
        canPostMedia: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canEditGroup: true,
        canPinMessages: true,
      },
    });

    // Add initial members if provided
    if (createGroupDto.memberIds && createGroupDto.memberIds.length > 0) {
      await this.addMultipleMembers(
        savedGroup.id,
        userId,
        createGroupDto.memberIds,
      );
    }

    return savedGroup;
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: GroupType,
  ): Promise<{ groups: Group[]; total: number }> {
    const query = this.groupRepository
      .createQueryBuilder('group')
      .innerJoin('group.members', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('member.status = :status', {
        status: GroupMemberStatus.ACTIVE,
      })
      .andWhere('group.isActive = :isActive', { isActive: true });

    if (type) {
      query.andWhere('group.type = :type', { type });
    }

    query
      .orderBy('group.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [groups, total] = await query.getManyAndCount();

    return { groups, total };
  }

  async findOne(groupId: string, userId: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId, isActive: true },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Verify user is a member
    await this.verifyMembership(groupId, userId);

    return group;
  }

  async update(
    groupId: string,
    userId: string,
    updateGroupDto: UpdateGroupDto,
  ): Promise<Group> {
    const group = await this.findOne(groupId, userId);

    // Check if user has permission to edit
    const member = await this.getMember(groupId, userId);
    if (
      member.role !== GroupMemberRole.OWNER &&
      member.role !== GroupMemberRole.ADMIN &&
      (!member.permissions?.canEditGroup || member.permissions.canEditGroup === false)
    ) {
      throw new ForbiddenException('You do not have permission to edit this group');
    }

    // Update group
    Object.assign(group, updateGroupDto);

    // Update conversation name if group name changed
    if (updateGroupDto.name) {
      await this.conversationsService.updateConversation(
        userId,
        group.conversationId,
        {
          name: updateGroupDto.name,
        },
      );
    }

    return this.groupRepository.save(group);
  }

  async delete(groupId: string, userId: string): Promise<void> {
    const group = await this.findOne(groupId, userId);

    // Only owner can delete group
    const member = await this.getMember(groupId, userId);
    if (member.role !== GroupMemberRole.OWNER) {
      throw new ForbiddenException('Only the group owner can delete the group');
    }

    // Soft delete
    group.isActive = false;
    await this.groupRepository.save(group);

    // Delete the conversation
    await this.conversationsService.deleteConversation(userId, group.conversationId);
  }

  async addMember(
    groupId: string,
    inviterId: string,
    addMemberDto: AddMemberDto,
  ): Promise<GroupMember> {
    const group = await this.findOne(groupId, inviterId);

    // Check if inviter has permission
    const inviter = await this.getMember(groupId, inviterId);
    if (
      inviter.role !== GroupMemberRole.OWNER &&
      inviter.role !== GroupMemberRole.ADMIN &&
      (!inviter.permissions?.canInviteMembers || inviter.permissions.canInviteMembers === false)
    ) {
      throw new ForbiddenException('You do not have permission to add members');
    }

    // Check if group is full
    if (group.memberCount >= group.maxMembers) {
      throw new BadRequestException('Group has reached maximum member limit');
    }

    // Check if user is already a member
    const existingMember = await this.groupMemberRepository.findOne({
      where: { groupId, userId: addMemberDto.userId },
    });

    if (existingMember) {
      if (existingMember.status === GroupMemberStatus.ACTIVE) {
        throw new BadRequestException('User is already a member');
      } else if (existingMember.status === GroupMemberStatus.BANNED) {
        throw new BadRequestException('User is banned from this group');
      } else if (existingMember.status === GroupMemberStatus.LEFT) {
        // Reactivate membership
        existingMember.status = GroupMemberStatus.ACTIVE;
        existingMember.joinedAt = new Date();
        existingMember.leftAt = null;
        return this.groupMemberRepository.save(existingMember);
      }
    }

    // Determine initial status based on privacy
    let status = GroupMemberStatus.ACTIVE;
    if (group.privacy === GroupPrivacy.APPROVAL_REQUIRED) {
      status = GroupMemberStatus.PENDING;
    }

    // Add to conversation
    await this.conversationsService.addParticipants(
      inviterId,
      group.conversationId,
      [addMemberDto.userId],
    );

    // Create membership
    const member = this.groupMemberRepository.create({
      groupId,
      userId: addMemberDto.userId,
      role: addMemberDto.role || GroupMemberRole.MEMBER,
      status,
      joinedAt: new Date(),
      invitedById: inviterId,
      permissions: {
        canPostMessages: group.settings?.allowMemberPosts !== false,
        canPostMedia: group.settings?.allowMemberMedia !== false,
        canInviteMembers: group.settings?.allowMemberInvites === true,
        canRemoveMembers: false,
        canEditGroup: false,
        canPinMessages: false,
      },
    });

    const savedMember = await this.groupMemberRepository.save(member);

    // Update member count if active
    if (status === GroupMemberStatus.ACTIVE) {
      await this.incrementMemberCount(groupId);
    }

    return savedMember;
  }

  async removeMember(
    groupId: string,
    removerId: string,
    memberUserId: string,
  ): Promise<void> {
    const group = await this.findOne(groupId, removerId);

    // Get remover's membership
    const remover = await this.getMember(groupId, removerId);

    // Get member to be removed
    const member = await this.getMember(groupId, memberUserId);

    // Check permissions
    if (member.role === GroupMemberRole.OWNER) {
      throw new ForbiddenException('Cannot remove the group owner');
    }

    if (
      remover.role !== GroupMemberRole.OWNER &&
      remover.role !== GroupMemberRole.ADMIN &&
      (!remover.permissions?.canRemoveMembers || remover.permissions.canRemoveMembers === false)
    ) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    // Admins cannot remove other admins
    if (
      remover.role === GroupMemberRole.ADMIN &&
      member.role === GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException('Admins cannot remove other admins');
    }

    // Update member status
    member.status = GroupMemberStatus.LEFT;
    member.leftAt = new Date();
    await this.groupMemberRepository.save(member);

    // Remove from conversation
    await this.conversationsService.removeParticipant(
      removerId,
      group.conversationId,
      memberUserId,
    );

    // Decrement member count
    await this.decrementMemberCount(groupId);
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const member = await this.getMember(groupId, userId);

    if (member.role === GroupMemberRole.OWNER) {
      throw new BadRequestException(
        'Owner cannot leave the group. Transfer ownership or delete the group.',
      );
    }

    // Update member status
    member.status = GroupMemberStatus.LEFT;
    member.leftAt = new Date();
    await this.groupMemberRepository.save(member);

    // Remove from conversation
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (group) {
      await this.conversationsService.removeParticipant(
        userId,
        group.conversationId,
        userId,
      );
    }

    // Decrement member count
    await this.decrementMemberCount(groupId);
  }

  async updateMemberRole(
    groupId: string,
    updaterId: string,
    memberUserId: string,
    newRole: GroupMemberRole,
  ): Promise<GroupMember> {
    await this.findOne(groupId, updaterId);

    const updater = await this.getMember(groupId, updaterId);
    const member = await this.getMember(groupId, memberUserId);

    // Only owner can change roles
    if (updater.role !== GroupMemberRole.OWNER) {
      throw new ForbiddenException('Only the owner can change member roles');
    }

    // Cannot change owner role
    if (member.role === GroupMemberRole.OWNER) {
      throw new ForbiddenException('Cannot change the owner role');
    }

    // Cannot set someone as owner
    if (newRole === GroupMemberRole.OWNER) {
      throw new BadRequestException('Use transfer ownership endpoint instead');
    }

    member.role = newRole;

    // Update permissions based on role
    if (newRole === GroupMemberRole.ADMIN) {
      member.permissions = {
        canPostMessages: true,
        canPostMedia: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canEditGroup: true,
        canPinMessages: true,
      };
    } else if (newRole === GroupMemberRole.MODERATOR) {
      member.permissions = {
        canPostMessages: true,
        canPostMedia: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canEditGroup: false,
        canPinMessages: true,
      };
    }

    return this.groupMemberRepository.save(member);
  }

  async transferOwnership(
    groupId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ): Promise<void> {
    await this.findOne(groupId, currentOwnerId);

    const currentOwner = await this.getMember(groupId, currentOwnerId);
    const newOwner = await this.getMember(groupId, newOwnerId);

    if (currentOwner.role !== GroupMemberRole.OWNER) {
      throw new ForbiddenException('Only the current owner can transfer ownership');
    }

    // Transfer ownership
    currentOwner.role = GroupMemberRole.ADMIN;
    newOwner.role = GroupMemberRole.OWNER;
    newOwner.permissions = {
      canPostMessages: true,
      canPostMedia: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canEditGroup: true,
      canPinMessages: true,
    };

    await this.groupMemberRepository.save([currentOwner, newOwner]);
  }

  async banMember(
    groupId: string,
    bannerId: string,
    memberUserId: string,
    reason?: string,
  ): Promise<GroupMember> {
    await this.findOne(groupId, bannerId);

    const banner = await this.getMember(groupId, bannerId);
    const member = await this.getMember(groupId, memberUserId);

    // Check permissions
    if (member.role === GroupMemberRole.OWNER) {
      throw new ForbiddenException('Cannot ban the group owner');
    }

    if (
      banner.role !== GroupMemberRole.OWNER &&
      banner.role !== GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException('Only owners and admins can ban members');
    }

    // Admins cannot ban other admins
    if (
      banner.role === GroupMemberRole.ADMIN &&
      member.role === GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException('Admins cannot ban other admins');
    }

    // Update member status
    member.status = GroupMemberStatus.BANNED;
    member.bannedAt = new Date();
    member.bannedById = bannerId;
    member.banReason = reason || null;

    // Decrement member count if was active
    if (member.status === GroupMemberStatus.ACTIVE) {
      await this.decrementMemberCount(groupId);
    }

    return this.groupMemberRepository.save(member);
  }

  async unbanMember(
    groupId: string,
    unbannerId: string,
    memberUserId: string,
  ): Promise<GroupMember> {
    await this.findOne(groupId, unbannerId);

    const unbanner = await this.getMember(groupId, unbannerId);
    const member = await this.getMember(groupId, memberUserId);

    // Check permissions
    if (
      unbanner.role !== GroupMemberRole.OWNER &&
      unbanner.role !== GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException('Only owners and admins can unban members');
    }

    if (member.status !== GroupMemberStatus.BANNED) {
      throw new BadRequestException('Member is not banned');
    }

    // Unban
    member.status = GroupMemberStatus.ACTIVE;
    member.bannedAt = null;
    member.bannedById = null;
    member.banReason = null;
    member.joinedAt = new Date();

    await this.incrementMemberCount(groupId);

    return this.groupMemberRepository.save(member);
  }

  async getMembers(
    groupId: string,
    userId: string,
    status?: GroupMemberStatus,
  ): Promise<GroupMember[]> {
    await this.findOne(groupId, userId);

    const query: any = { groupId };
    if (status) {
      query.status = status;
    }

    return this.groupMemberRepository.find({
      where: query,
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async getMember(groupId: string, userId: string): Promise<GroupMember> {
    const member = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this group');
    }

    return member;
  }

  async searchGroups(
    query: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ groups: Group[]; total: number }> {
    const queryBuilder = this.groupRepository
      .createQueryBuilder('group')
      .where('group.isActive = :isActive', { isActive: true })
      .andWhere(
        '(group.type = :publicType OR EXISTS (SELECT 1 FROM group_members WHERE groupId = group.id AND userId = :userId))',
        { publicType: GroupType.PUBLIC, userId },
      )
      .andWhere(
        '(group.name ILIKE :query OR group.description ILIKE :query OR :query = ANY(group.tags))',
        { query: `%${query}%` },
      )
      .orderBy('group.memberCount', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [groups, total] = await queryBuilder.getManyAndCount();

    return { groups, total };
  }

  async updateGroupSettings(
    groupId: string,
    userId: string,
    settings: Record<string, any>,
  ): Promise<Group> {
    const group = await this.findOne(groupId, userId);

    const member = await this.getMember(groupId, userId);
    if (
      member.role !== GroupMemberRole.OWNER &&
      member.role !== GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only owners and admins can update group settings',
      );
    }

    group.settings = { ...group.settings, ...settings };

    return this.groupRepository.save(group);
  }

  async updateMemberPermissions(
    groupId: string,
    updaterId: string,
    memberUserId: string,
    permissions: Record<string, any>,
  ): Promise<GroupMember> {
    await this.findOne(groupId, updaterId);

    const updater = await this.getMember(groupId, updaterId);
    const member = await this.getMember(groupId, memberUserId);

    // Only owner and admin can update permissions
    if (
      updater.role !== GroupMemberRole.OWNER &&
      updater.role !== GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only owners and admins can update member permissions',
      );
    }

    // Cannot update owner or admin permissions
    if (
      member.role === GroupMemberRole.OWNER ||
      member.role === GroupMemberRole.ADMIN
    ) {
      throw new ForbiddenException('Cannot update owner or admin permissions');
    }

    member.permissions = { ...member.permissions, ...permissions };

    return this.groupMemberRepository.save(member);
  }

  private async verifyMembership(
    groupId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.groupMemberRepository.findOne({
      where: {
        groupId,
        userId,
        status: GroupMemberStatus.ACTIVE,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }
  }

  private async addMultipleMembers(
    groupId: string,
    inviterId: string,
    memberIds: string[],
  ): Promise<void> {
    for (const memberId of memberIds) {
      try {
        await this.addMember(groupId, inviterId, { userId: memberId });
      } catch (error) {
        // Continue adding other members even if one fails
        console.error(`Failed to add member ${memberId}:`, error.message);
      }
    }
  }

  private async incrementMemberCount(groupId: string): Promise<void> {
    await this.groupRepository.increment({ id: groupId }, 'memberCount', 1);
  }

  private async decrementMemberCount(groupId: string): Promise<void> {
    await this.groupRepository.decrement({ id: groupId }, 'memberCount', 1);
  }
}
