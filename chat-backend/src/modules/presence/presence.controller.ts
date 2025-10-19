import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PresenceService } from './presence.service';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { GetUser } from '@common/decorators/get-user.decorator';

@ApiTags('presence')
@ApiBearerAuth()
@Controller({ path: 'presence', version: '1' })
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  /**
   * Get current user's presence
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user presence' })
  async getMyPresence(@GetUser('id') userId: string) {
    const presence = await this.presenceService.getOrCreatePresence(userId);
    return {
      success: true,
      data: presence,
    };
  }

  /**
   * Update current user's presence
   */
  @Put('me')
  @ApiOperation({ summary: 'Update current user presence' })
  async updateMyPresence(
    @GetUser('id') userId: string,
    @Body() updateDto: UpdatePresenceDto,
  ) {
    const presence = await this.presenceService.updatePresence(
      userId,
      updateDto,
    );
    return {
      success: true,
      data: presence,
    };
  }

  /**
   * Get presence by user ID
   */
  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user presence by ID' })
  async getUserPresence(@Param('userId') userId: string) {
    const presence = await this.presenceService.getOrCreatePresence(userId);
    return {
      success: true,
      data: presence,
    };
  }

  /**
   * Get presence for multiple users
   */
  @Get('users')
  @ApiOperation({ summary: 'Get presence for multiple users' })
  @ApiQuery({
    name: 'userIds',
    required: true,
    type: String,
    description: 'Comma-separated user IDs',
  })
  async getMultipleUsersPresence(@Query('userIds') userIds: string) {
    const userIdArray = userIds.split(',');
    const presences = await this.presenceService.getPresenceForUsers(
      userIdArray,
    );
    return {
      success: true,
      data: presences,
    };
  }

  /**
   * Get typing users in a conversation
   */
  @Get('conversations/:conversationId/typing')
  @ApiOperation({ summary: 'Get typing users in a conversation' })
  async getTypingUsers(@Param('conversationId') conversationId: string) {
    const typingUsers = await this.presenceService.getTypingUsers(
      conversationId,
    );
    return {
      success: true,
      data: typingUsers,
    };
  }
}
