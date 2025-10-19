import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { GroupType } from './entities/group.entity';
import { GroupMemberRole, GroupMemberStatus } from './entities/group-member.entity';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req, @Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.createGroup(req.user.sub, createGroupDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all groups for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: GroupType })
  @ApiResponse({ status: 200, description: 'Groups retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: GroupType,
  ) {
    return this.groupsService.findAll(req.user.sub, page, limit, type);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search groups' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  async search(
    @Request() req,
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.groupsService.searchGroups(query, req.user.sub, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Group retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.groupsService.findOne(id, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update group' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Group updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, req.user.sub, updateGroupDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete group (owner only)' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Group deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async delete(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    await this.groupsService.delete(id, req.user.sub);
    return { message: 'Group deleted successfully' };
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave group' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Left group successfully' })
  @ApiResponse({ status: 400, description: 'Owner cannot leave' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async leave(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    await this.groupsService.leaveGroup(id, req.user.sub);
    return { message: 'Left group successfully' };
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get group members' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiQuery({ name: 'status', required: false, enum: GroupMemberStatus })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  async getMembers(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: GroupMemberStatus,
  ) {
    return this.groupsService.getMembers(id, req.user.sub, status);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to group' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async addMember(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.groupsService.addMember(id, req.user.sub, addMemberDto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from group' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID to remove' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeMember(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    await this.groupsService.removeMember(id, req.user.sub, userId);
    return { message: 'Member removed successfully' };
  }

  @Put(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update member role' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateMemberRole(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('role') role: GroupMemberRole,
  ) {
    return this.groupsService.updateMemberRole(id, req.user.sub, userId, role);
  }

  @Put(':id/members/:userId/permissions')
  @ApiOperation({ summary: 'Update member permissions' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateMemberPermissions(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('permissions') permissions: Record<string, any>,
  ) {
    return this.groupsService.updateMemberPermissions(
      id,
      req.user.sub,
      userId,
      permissions,
    );
  }

  @Post(':id/transfer-ownership')
  @ApiOperation({ summary: 'Transfer group ownership' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Ownership transferred successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async transferOwnership(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newOwnerId') newOwnerId: string,
  ) {
    await this.groupsService.transferOwnership(id, req.user.sub, newOwnerId);
    return { message: 'Ownership transferred successfully' };
  }

  @Post(':id/members/:userId/ban')
  @ApiOperation({ summary: 'Ban member from group' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID to ban' })
  @ApiResponse({ status: 200, description: 'Member banned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async banMember(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.groupsService.banMember(id, req.user.sub, userId, reason);
  }

  @Post(':id/members/:userId/unban')
  @ApiOperation({ summary: 'Unban member from group' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID to unban' })
  @ApiResponse({ status: 200, description: 'Member unbanned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async unbanMember(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.groupsService.unbanMember(id, req.user.sub, userId);
  }

  @Put(':id/settings')
  @ApiOperation({ summary: 'Update group settings' })
  @ApiParam({ name: 'id', type: String, description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateSettings(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('settings') settings: Record<string, any>,
  ) {
    return this.groupsService.updateGroupSettings(id, req.user.sub, settings);
  }
}
