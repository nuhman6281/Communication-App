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
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ChannelType, ChannelCategory } from './entities/channel.entity';
import {
  ChannelSubscriberRole,
  ChannelSubscriberStatus,
} from './entities/channel-subscriber.entity';

@ApiTags('Channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new channel' })
  @ApiResponse({ status: 201, description: 'Channel created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Handle already exists' })
  async create(@Request() req, @Body() createChannelDto: CreateChannelDto) {
    return this.channelsService.createChannel(req.user.sub, createChannelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all public channels' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ChannelType })
  @ApiQuery({ name: 'category', required: false, enum: ChannelCategory })
  @ApiResponse({ status: 200, description: 'Channels retrieved successfully' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('type') type?: ChannelType,
    @Query('category') category?: ChannelCategory,
  ) {
    return this.channelsService.findAll(page, limit, type, category);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get user subscribed channels' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Channels retrieved successfully' })
  async findMyChannels(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.channelsService.findUserChannels(req.user.sub, page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search channels' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results retrieved' })
  async search(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.channelsService.searchChannels(query, page, limit);
  }

  @Get('handle/:handle')
  @ApiOperation({ summary: 'Get channel by handle' })
  @ApiParam({ name: 'handle', type: String, description: 'Channel handle' })
  @ApiResponse({ status: 200, description: 'Channel retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  async findByHandle(@Request() req, @Param('handle') handle: string) {
    return this.channelsService.findByHandle(handle, req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get channel by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Channel ID' })
  @ApiResponse({ status: 200, description: 'Channel retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  async findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.channelsService.findOne(id, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update channel' })
  @ApiParam({ name: 'id', type: String, description: 'Channel ID' })
  @ApiResponse({ status: 200, description: 'Channel updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelsService.update(id, req.user.sub, updateChannelDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete channel (owner only)' })
  @ApiParam({ name: 'id', type: String, description: 'Channel ID' })
  @ApiResponse({ status: 200, description: 'Channel deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Channel not found' })
  async delete(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    await this.channelsService.delete(id, req.user.sub);
    return { message: 'Channel deleted successfully' };
  }

  @Post(':id/subscribe')
  @ApiOperation({ summary: 'Subscribe to channel' })
  @ApiParam({ name: 'id', type: String, description: 'Channel ID' })
  @ApiResponse({ status: 201, description: 'Subscribed successfully' })
  @ApiResponse({ status: 400, description: 'Already subscribed' })
  @ApiResponse({ status: 403, description: 'Blocked from channel' })
  async subscribe(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.channelsService.subscribe(id, req.user.sub);
  }

  @Delete(':id/subscribe')
  @ApiOperation({ summary: 'Unsubscribe from channel' })
  @ApiParam({ name: 'id', type: String, description: 'Channel ID' })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  @ApiResponse({ status: 404, description: 'Not subscribed' })
  async unsubscribe(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    await this.channelsService.unsubscribe(id, req.user.sub);
    return { message: 'Unsubscribed successfully' };
  }

  @Get(':id/subscribers')
  @ApiOperation({ summary: 'Get channel subscribers' })
  @ApiParam({ name: 'id', type: String, description: 'Channel ID' })
  @ApiQuery({ name: 'status', required: false, enum: ChannelSubscriberStatus })
  @ApiResponse({ status: 200, description: 'Subscribers retrieved successfully' })
  async getSubscribers(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status?: ChannelSubscriberStatus,
  ) {
    return this.channelsService.getSubscribers(id, req.user.sub, status);
  }

  @Put(':id/subscribers/:userId/role')
  @ApiOperation({ summary: 'Update subscriber role' })
  @ApiParam({ name: 'id', type: String, description: 'Channel ID' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateSubscriberRole(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('role') role: ChannelSubscriberRole,
  ) {
    return this.channelsService.updateSubscriberRole(
      id,
      req.user.sub,
      userId,
      role,
    );
  }

  @Post(':id/transfer-ownership')
  @ApiOperation({ summary: 'Transfer channel ownership' })
  @ApiParam({ name: 'id', type: String, description: 'Channel ID' })
  @ApiResponse({
    status: 200,
    description: 'Ownership transferred successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async transferOwnership(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newOwnerId') newOwnerId: string,
  ) {
    await this.channelsService.transferOwnership(id, req.user.sub, newOwnerId);
    return { message: 'Ownership transferred successfully' };
  }

  @Post(':id/subscribers/:userId/block')
  @ApiOperation({ summary: 'Block subscriber from channel' })
  @ApiParam({ name: 'id', type: String, description: 'Channel ID' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID to block' })
  @ApiResponse({ status: 200, description: 'Subscriber blocked successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async blockSubscriber(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.channelsService.blockSubscriber(
      id,
      req.user.sub,
      userId,
      reason,
    );
  }

  @Post(':id/subscribers/:userId/unblock')
  @ApiOperation({ summary: 'Unblock subscriber from channel' })
  @ApiParam({ name: 'id', type: String, description: 'Channel ID' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID to unblock' })
  @ApiResponse({
    status: 200,
    description: 'Subscriber unblocked successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async unblockSubscriber(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.channelsService.unblockSubscriber(id, req.user.sub, userId);
  }
}
