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
import { MessagesService } from './messages.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@modules/users/entities/user.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageReactionDto } from './dto/message-reaction.dto';
import { ForwardMessageDto } from './dto/forward-message.dto';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 403, description: 'Not a participant in conversation' })
  async sendMessage(
    @CurrentUser() user: User,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    return this.messagesService.sendMessage(user.id, createMessageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get messages in a conversation' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getMessages(
    @CurrentUser() user: User,
    @Query() getMessagesDto: GetMessagesDto,
  ) {
    return this.messagesService.getMessages(user.id, getMessagesDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a message by ID' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getMessageById(@CurrentUser() user: User, @Param('id') messageId: string) {
    return this.messagesService.getMessageById(user.id, messageId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message edited successfully' })
  @ApiResponse({ status: 403, description: 'Only sender can edit message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async editMessage(
    @CurrentUser() user: User,
    @Param('id') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messagesService.editMessage(user.id, messageId, updateMessageDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 403, description: 'Only sender can delete message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(@CurrentUser() user: User, @Param('id') messageId: string) {
    return this.messagesService.deleteMessage(user.id, messageId);
  }

  // ==================== Reactions ====================

  @Post(':id/reactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add reaction to message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Reaction added successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async addReaction(
    @CurrentUser() user: User,
    @Param('id') messageId: string,
    @Body() reactionDto: MessageReactionDto,
  ) {
    return this.messagesService.addReaction(user.id, messageId, reactionDto);
  }

  @Delete(':id/reactions/:emoji')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove reaction from message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiParam({ name: 'emoji', description: 'Emoji to remove' })
  @ApiResponse({ status: 200, description: 'Reaction removed successfully' })
  @ApiResponse({ status: 404, description: 'Reaction not found' })
  async removeReaction(
    @CurrentUser() user: User,
    @Param('id') messageId: string,
    @Param('emoji') emoji: string,
  ) {
    return this.messagesService.removeReaction(user.id, messageId, emoji);
  }

  // ==================== Read Receipts ====================

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async markAsRead(@CurrentUser() user: User, @Param('id') messageId: string) {
    return this.messagesService.markAsRead(user.id, messageId);
  }

  @Get(':id/reads')
  @ApiOperation({ summary: 'Get read receipts for a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Read receipts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getReadReceipts(@CurrentUser() user: User, @Param('id') messageId: string) {
    return this.messagesService.getReadReceipts(user.id, messageId);
  }

  // ==================== Forward Messages ====================

  @Post(':id/forward')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forward message to multiple conversations' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message forwarded successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async forwardMessage(
    @CurrentUser() user: User,
    @Param('id') messageId: string,
    @Body() forwardMessageDto: ForwardMessageDto,
  ) {
    return this.messagesService.forwardMessage(user.id, messageId, forwardMessageDto);
  }

  // ==================== Edit History ====================

  @Get(':id/edit-history')
  @ApiOperation({ summary: 'Get edit history for a message' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Edit history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getEditHistory(@CurrentUser() user: User, @Param('id') messageId: string) {
    return this.messagesService.getEditHistory(user.id, messageId);
  }

  // ==================== Pinned Messages ====================

  @Post('conversations/:conversationId/pin/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pin a message in a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message pinned successfully' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async pinMessage(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.pinMessage(user.id, conversationId, messageId);
  }

  @Delete('conversations/:conversationId/pin/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpin a message from a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message unpinned successfully' })
  @ApiResponse({ status: 404, description: 'Pinned message not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async unpinMessage(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.unpinMessage(user.id, conversationId, messageId);
  }

  @Get('conversations/:conversationId/pinned')
  @ApiOperation({ summary: 'Get all pinned messages in a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Pinned messages retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getPinnedMessages(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messagesService.getPinnedMessages(user.id, conversationId);
  }
}
