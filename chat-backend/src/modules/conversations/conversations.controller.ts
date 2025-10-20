import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@modules/users/entities/user.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { GetConversationsDto } from './dto/get-conversations.dto';

@ApiTags('conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  // ==================== Conversation Management ====================

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or blocked users' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async createConversation(
    @CurrentUser() user: User,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.conversationsService.createConversation(user.id, createConversationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  async getUserConversations(
    @CurrentUser() user: User,
    @Query() query: GetConversationsDto,
  ) {
    return this.conversationsService.getUserConversations(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found or access denied' })
  async getConversationById(@CurrentUser() user: User, @Param('id') conversationId: string) {
    return this.conversationsService.getConversationById(user.id, conversationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update conversation details (admin/owner only)' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot update direct conversations' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async updateConversation(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.conversationsService.updateConversation(
      user.id,
      conversationId,
      updateConversationDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete conversation (owner only)' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only owner can delete conversation' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteConversation(@CurrentUser() user: User, @Param('id') conversationId: string) {
    return this.conversationsService.deleteConversation(user.id, conversationId);
  }

  // ==================== Participant Management ====================

  @Post(':id/participants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add participants to conversation (admin/owner only)' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Participants added successfully' })
  @ApiResponse({ status: 400, description: 'Cannot add to direct conversations or blocked users' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'User already a participant' })
  async addParticipants(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body() addParticipantDto: AddParticipantDto,
  ) {
    return this.conversationsService.addParticipants(
      user.id,
      conversationId,
      addParticipantDto,
    );
  }

  @Delete(':id/participants/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove participant from conversation (admin/owner only)' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiResponse({ status: 200, description: 'Participant removed successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions or cannot remove owner' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async removeParticipant(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Param('userId') participantUserId: string,
  ) {
    return this.conversationsService.removeParticipant(
      user.id,
      conversationId,
      participantUserId,
    );
  }

  // ==================== Participant Settings ====================

  @Put(':id/settings')
  @ApiOperation({ summary: 'Update participant settings (mute, archive, pin, notifications)' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async updateParticipantSettings(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body() updateParticipantDto: UpdateParticipantDto,
  ) {
    return this.conversationsService.updateParticipantSettings(
      user.id,
      conversationId,
      updateParticipantDto,
    );
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Left conversation successfully' })
  @ApiResponse({ status: 400, description: 'Cannot leave direct conversations' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async leaveConversation(@CurrentUser() user: User, @Param('id') conversationId: string) {
    return this.conversationsService.leaveConversation(user.id, conversationId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Marked as read' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body('messageId') messageId: string,
  ) {
    return this.conversationsService.markAsRead(user.id, conversationId, messageId);
  }

  // ==================== Messages ====================

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages in conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a participant in conversation' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversationMessages(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('beforeMessageId') beforeMessageId?: string,
  ) {
    return this.conversationsService.getConversationMessages(user.id, conversationId, {
      page: page || 1,
      limit: limit || 50,
      beforeMessageId,
    });
  }
}
