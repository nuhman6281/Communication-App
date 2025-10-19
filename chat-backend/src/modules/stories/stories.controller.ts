import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { GetStoriesDto } from './dto/get-stories.dto';
import { CreateStoryReplyDto } from './dto/create-story-reply.dto';
import { Story } from './entities/story.entity';
import { StoryView } from './entities/story-view.entity';
import { StoryReply } from './entities/story-reply.entity';

@ApiTags('Stories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new story' })
  @ApiResponse({ status: 201, description: 'Story created successfully' })
  async createStory(
    @Req() req: any,
    @Body() createStoryDto: CreateStoryDto,
  ): Promise<{
    success: boolean;
    data: Story;
  }> {
    const userId = req.user.sub;
    const story = await this.storiesService.createStory(userId, createStoryDto);

    return {
      success: true,
      data: story,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all active stories from other users (feed)' })
  @ApiResponse({ status: 200, description: 'Returns stories feed' })
  async getStories(
    @Req() req: any,
    @Query() filters: GetStoriesDto,
  ): Promise<{
    success: boolean;
    data: {
      stories: Story[];
      total: number;
      page: number;
      limit: number;
    };
  }> {
    const userId = req.user.sub;
    const result = await this.storiesService.getStories(userId, filters);

    return {
      success: true,
      data: {
        ...result,
        page: filters.page || 1,
        limit: filters.limit || 20,
      },
    };
  }

  @Get('me')
  @ApiOperation({ summary: "Get current user's own stories" })
  @ApiResponse({ status: 200, description: "Returns user's stories" })
  async getMyStories(
    @Req() req: any,
    @Query() filters: GetStoriesDto,
  ): Promise<{
    success: boolean;
    data: {
      stories: Story[];
      total: number;
      page: number;
      limit: number;
    };
  }> {
    const userId = req.user.sub;
    const result = await this.storiesService.getMyStories(userId, filters);

    return {
      success: true,
      data: {
        ...result,
        page: filters.page || 1,
        limit: filters.limit || 20,
      },
    };
  }

  @Get('highlights/me')
  @ApiOperation({ summary: "Get current user's highlights" })
  @ApiResponse({ status: 200, description: "Returns user's highlights" })
  async getMyHighlights(@Req() req: any): Promise<{
    success: boolean;
    data: Story[];
  }> {
    const userId = req.user.sub;
    const highlights = await this.storiesService.getHighlights(userId);

    return {
      success: true,
      data: highlights,
    };
  }

  @Get('stats/me')
  @ApiOperation({ summary: "Get current user's stories statistics" })
  @ApiResponse({ status: 200, description: 'Returns user stories stats' })
  async getMyStats(@Req() req: any): Promise<{
    success: boolean;
    data: {
      totalStories: number;
      activeStories: number;
      totalViews: number;
      totalReplies: number;
      highlightsCount: number;
    };
  }> {
    const userId = req.user.sub;
    const stats = await this.storiesService.getUserStoriesStats(userId);

    return {
      success: true,
      data: stats,
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: "Get a specific user's stories" })
  @ApiResponse({ status: 200, description: "Returns user's stories" })
  async getUserStories(
    @Req() req: any,
    @Param('userId') userId: string,
  ): Promise<{
    success: boolean;
    data: Story[];
  }> {
    const viewerId = req.user.sub;
    const stories = await this.storiesService.getUserStories(userId, viewerId);

    return {
      success: true,
      data: stories,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single story by ID' })
  @ApiResponse({ status: 200, description: 'Returns the story' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  async getStory(
    @Req() req: any,
    @Param('id') storyId: string,
  ): Promise<{
    success: boolean;
    data: Story;
  }> {
    const viewerId = req.user.sub;
    const story = await this.storiesService.getStory(storyId, viewerId);

    return {
      success: true,
      data: story,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a story' })
  @ApiResponse({ status: 200, description: 'Story updated successfully' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async updateStory(
    @Req() req: any,
    @Param('id') storyId: string,
    @Body() updateStoryDto: UpdateStoryDto,
  ): Promise<{
    success: boolean;
    data: Story;
  }> {
    const userId = req.user.sub;
    const story = await this.storiesService.updateStory(storyId, userId, updateStoryDto);

    return {
      success: true,
      data: story,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a story' })
  @ApiResponse({ status: 204, description: 'Story deleted successfully' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async deleteStory(
    @Req() req: any,
    @Param('id') storyId: string,
  ): Promise<void> {
    const userId = req.user.sub;
    await this.storiesService.deleteStory(storyId, userId);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'View a story (record view)' })
  @ApiResponse({ status: 201, description: 'Story view recorded' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  async viewStory(
    @Req() req: any,
    @Param('id') storyId: string,
  ): Promise<{
    success: boolean;
    data: StoryView;
  }> {
    const viewerId = req.user.sub;
    const view = await this.storiesService.viewStory(storyId, viewerId);

    return {
      success: true,
      data: view,
    };
  }

  @Get(':id/views')
  @ApiOperation({ summary: 'Get views for a story (owner only)' })
  @ApiResponse({ status: 200, description: 'Returns story views' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async getStoryViews(
    @Req() req: any,
    @Param('id') storyId: string,
  ): Promise<{
    success: boolean;
    data: StoryView[];
  }> {
    const userId = req.user.sub;
    const views = await this.storiesService.getStoryViews(storyId, userId);

    return {
      success: true,
      data: views,
    };
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to a story' })
  @ApiResponse({ status: 201, description: 'Reply sent successfully' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  async replyToStory(
    @Req() req: any,
    @Param('id') storyId: string,
    @Body() createStoryReplyDto: CreateStoryReplyDto,
  ): Promise<{
    success: boolean;
    data: StoryReply;
  }> {
    const senderId = req.user.sub;
    const reply = await this.storiesService.replyToStory(storyId, senderId, createStoryReplyDto);

    return {
      success: true,
      data: reply,
    };
  }

  @Get(':id/replies')
  @ApiOperation({ summary: 'Get replies for a story (owner only)' })
  @ApiResponse({ status: 200, description: 'Returns story replies' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  async getStoryReplies(
    @Req() req: any,
    @Param('id') storyId: string,
  ): Promise<{
    success: boolean;
    data: StoryReply[];
  }> {
    const userId = req.user.sub;
    const replies = await this.storiesService.getStoryReplies(storyId, userId);

    return {
      success: true,
      data: replies,
    };
  }

  @Put('replies/:replyId/read')
  @ApiOperation({ summary: 'Mark a story reply as read' })
  @ApiResponse({ status: 200, description: 'Reply marked as read' })
  @ApiResponse({ status: 404, description: 'Reply not found' })
  async markReplyAsRead(
    @Req() req: any,
    @Param('replyId') replyId: string,
  ): Promise<{
    success: boolean;
    data: StoryReply;
  }> {
    const userId = req.user.sub;
    const reply = await this.storiesService.markReplyAsRead(replyId, userId);

    return {
      success: true,
      data: reply,
    };
  }
}
