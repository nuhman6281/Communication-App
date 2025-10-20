import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspaceAdminGuard } from './guards/workspace-admin.guard';
import { WorkspaceOwnerGuard } from './guards/workspace-owner.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@modules/users/entities/user.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import {
  InviteMemberDto,
  AddMemberDirectDto,
} from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { GetWorkspacesDto } from './dto/get-workspaces.dto';
import { WorkspaceRole, MemberStatus } from './entities/workspace-member.entity';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // ========================================
  // WORKSPACE MANAGEMENT
  // ========================================

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Slug already taken' })
  async createWorkspace(
    @CurrentUser() user: User,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.createWorkspace(user.id, createWorkspaceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'onlyOwned', required: false, type: Boolean, description: 'Only show owned workspaces' })
  @ApiResponse({ status: 200, description: 'Workspaces retrieved successfully' })
  async getUserWorkspaces(
    @CurrentUser() user: User,
    @Query() query: GetWorkspacesDto,
  ) {
    return this.workspacesService.getUserWorkspaces(user.id, query);
  }

  @Get(':id')
  @UseGuards(WorkspaceMemberGuard)
  @ApiOperation({ summary: 'Get workspace details' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a workspace member' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getWorkspace(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workspacesService.getWorkspaceById(user.id, id);
  }

  @Patch(':id')
  @UseGuards(WorkspaceAdminGuard)
  @ApiOperation({ summary: 'Update workspace details (admin/owner only)' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin permission required' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async updateWorkspace(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.updateWorkspace(user.id, id, updateWorkspaceDto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceOwnerGuard)
  @ApiOperation({ summary: 'Delete workspace (owner only)' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete workspace with active resources' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner permission required' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async deleteWorkspace(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workspacesService.deleteWorkspace(user.id, id);
  }

  // ========================================
  // MEMBER MANAGEMENT
  // ========================================

  @Get(':id/members')
  @UseGuards(WorkspaceMemberGuard)
  @ApiOperation({ summary: 'Get workspace members' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: WorkspaceRole })
  @ApiQuery({ name: 'status', required: false, enum: MemberStatus })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a workspace member' })
  async getWorkspaceMembers(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: WorkspaceRole,
    @Query('status') status?: MemberStatus,
  ) {
    return this.workspacesService.getWorkspaceMembers(
      workspaceId,
      user.id,
      { page, limit, role, status },
    );
  }

  @Post(':id/members/invite')
  @UseGuards(WorkspaceAdminGuard)
  @ApiOperation({ summary: 'Invite member by email (admin/owner only)' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiResponse({ status: 201, description: 'Invitation sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin permission required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User already invited or member' })
  async inviteMember(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.workspacesService.inviteMemberByEmail(
      workspaceId,
      user.id,
      inviteMemberDto,
    );
  }

  @Post(':id/members')
  @UseGuards(WorkspaceAdminGuard)
  @ApiOperation({ summary: 'Add member directly without email (admin/owner only)' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin permission required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User already a member' })
  async addMemberDirect(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Body() addMemberDto: AddMemberDirectDto,
  ) {
    return this.workspacesService.addMemberDirect(
      workspaceId,
      user.id,
      addMemberDto,
    );
  }

  @Patch(':id/members/:userId')
  @UseGuards(WorkspaceAdminGuard)
  @ApiOperation({ summary: 'Update member role and permissions (admin/owner only)' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID to update' })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin permission required' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async updateMemberRole(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Body() updateMemberDto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(
      workspaceId,
      user.id,
      targetUserId,
      updateMemberDto,
    );
  }

  @Delete(':id/members/:userId')
  @UseGuards(WorkspaceAdminGuard)
  @ApiOperation({ summary: 'Remove member from workspace (admin/owner only)' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID to remove' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin permission required' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async removeMember(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.workspacesService.removeMember(workspaceId, user.id, targetUserId);
  }

  @Post(':id/leave')
  @UseGuards(WorkspaceMemberGuard)
  @ApiOperation({ summary: 'Leave workspace (members only, owner cannot leave)' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Left workspace successfully' })
  @ApiResponse({ status: 400, description: 'Owner cannot leave workspace' })
  @ApiResponse({ status: 403, description: 'Not a workspace member' })
  async leaveWorkspace(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) workspaceId: string,
  ) {
    return this.workspacesService.leaveWorkspace(workspaceId, user.id);
  }

  // ========================================
  // INVITATION LINKS
  // ========================================

  @Post(':id/invite/generate')
  @UseGuards(WorkspaceAdminGuard)
  @ApiOperation({ summary: 'Generate shareable invite link (admin/owner only)' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiResponse({ status: 201, description: 'Invite link generated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin permission required' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async generateInviteLink(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) workspaceId: string,
  ) {
    return this.workspacesService.generateInviteLink(workspaceId, user.id);
  }

  @Get('join/:inviteCode')
  @ApiOperation({ summary: 'Join workspace via invite code' })
  @ApiParam({ name: 'inviteCode', type: String, description: 'Invite code' })
  @ApiResponse({ status: 200, description: 'Joined workspace successfully' })
  @ApiResponse({ status: 400, description: 'Invalid invite code or workspace full' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  async joinByInviteCode(
    @CurrentUser() user: User,
    @Param('inviteCode') inviteCode: string,
  ) {
    return this.workspacesService.joinByInviteCode(user.id, inviteCode);
  }

  // ========================================
  // WORKSPACE RESOURCES
  // ========================================

  @Get(':id/channels')
  @UseGuards(WorkspaceMemberGuard)
  @ApiOperation({ summary: 'Get workspace channels' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Channels retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a workspace member' })
  async getWorkspaceChannels(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.workspacesService.getWorkspaceChannels(workspaceId, user.id, {
      page,
      limit,
    });
  }

  @Get(':id/groups')
  @UseGuards(WorkspaceMemberGuard)
  @ApiOperation({ summary: 'Get workspace groups' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Groups retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a workspace member' })
  async getWorkspaceGroups(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.workspacesService.getWorkspaceGroups(workspaceId, user.id, {
      page,
      limit,
    });
  }

  // ========================================
  // PERMISSION CHECKS
  // ========================================

  @Get(':id/permissions/:permission')
  @UseGuards(WorkspaceMemberGuard)
  @ApiOperation({ summary: 'Check if current user has a specific permission' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiParam({ name: 'permission', type: String, description: 'Permission to check' })
  @ApiResponse({ status: 200, description: 'Permission check result' })
  async checkPermission(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Param('permission') permission: string,
  ) {
    const hasPermission = await this.workspacesService.checkMemberPermission(
      workspaceId,
      user.id,
      permission,
    );

    return {
      workspaceId,
      userId: user.id,
      permission,
      hasPermission,
    };
  }

  @Get(':id/role')
  @UseGuards(WorkspaceMemberGuard)
  @ApiOperation({ summary: 'Get current user role in workspace' })
  @ApiParam({ name: 'id', type: String, description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  async getMemberRole(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) workspaceId: string,
  ) {
    const role = await this.workspacesService.getMemberRole(workspaceId, user.id);

    return {
      workspaceId,
      userId: user.id,
      role,
    };
  }
}
