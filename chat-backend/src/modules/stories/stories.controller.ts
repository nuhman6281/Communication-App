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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { GetUser } from '@common/decorators/get-user.decorator';
import { StoriesService } from './stories.service';
import { MediaService } from '@modules/media/media.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { GetStoriesDto } from './dto/get-stories.dto';
import { CreateStoryReplyDto } from './dto/create-story-reply.dto';
import { Story, StoryType, StoryPrivacy } from './entities/story.entity';
import { StoryView } from './entities/story-view.entity';
import { StoryReply } from './entities/story-reply.entity';

@ApiTags('Stories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stories')
export class StoriesController {
  constructor(
    private readonly storiesService: StoriesService,
    private readonly mediaService: MediaService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a story with media file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        media: {
          type: 'string',
          format: 'binary',
          description: 'Media file (image or video)',
        },
        caption: {
          type: 'string',
          description: 'Optional caption for the story',
        },
        privacy: {
          type: 'string',
          enum: ['public', 'friends', 'custom'],
          description: 'Privacy setting for the story',
        },
      },
      required: ['media'],
    },
  })
  @ApiResponse({ status: 201, description: 'Story created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @UseInterceptors(FileInterceptor('media'))
  async uploadStory(
    @GetUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
          new FileTypeValidator({ fileType: /(image|video)\/*/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body('caption') caption?: string,
    @Body('privacy') privacy?: string,
  ): Promise<{
    success: boolean;
    data: Story;
  }> {

    // Upload file using media service with messageId as uploaderId workaround
    const media = await this.mediaService.uploadFile(userId, file, {
      folder: 'stories',
      messageId: undefined, // Explicitly set to avoid any issues
    });

    // Determine story type from MIME type
    let storyType: StoryType;
    if (file.mimetype.startsWith('image/')) {
      storyType = StoryType.IMAGE;
    } else if (file.mimetype.startsWith('video/')) {
      storyType = StoryType.VIDEO;
    } else {
      throw new BadRequestException('Only image and video files are supported for stories');
    }

    // Validate and set privacy
    let storyPrivacy: StoryPrivacy = StoryPrivacy.PUBLIC;
    if (privacy) {
      if (!Object.values(StoryPrivacy).includes(privacy as StoryPrivacy)) {
        throw new BadRequestException('Invalid privacy setting');
      }
      storyPrivacy = privacy as StoryPrivacy;
    }

    // Create story with uploaded media
    const createStoryDto: CreateStoryDto = {
      type: storyType,
      mediaUrl: media.url,
      caption: caption || undefined,
      privacy: storyPrivacy,
    };

    const story = await this.storiesService.createStory(userId, createStoryDto);

    return {
      success: true,
      data: story,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new story' })
  @ApiResponse({ status: 201, description: 'Story created successfully' })
  async createStory(
    @GetUser('id') userId: string,
    @Body() createStoryDto: CreateStoryDto,
  ): Promise<{
    success: boolean;
    data: Story;
  }> {
    const story = await this.storiesService.createStory(userId, createStoryDto);

    return {
      success: true,
      data: story,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all active stories from other users (feed) - grouped by user' })
  @ApiResponse({ status: 200, description: 'Returns stories feed grouped by user' })
  async getStories(
    @GetUser('id') userId: string,
  ): Promise<Array<{
    userId: string;
    username: string;
    avatarUrl: string | null;
    stories: Story[];
    latestStoryAt: string;
    unseenCount: number;
  }>> {
    return await this.storiesService.getActiveStoriesGrouped(userId);
  }

  @Get('me')
  @ApiOperation({ summary: "Get current user's own stories" })
  @ApiResponse({ status: 200, description: "Returns user's stories" })
  async getMyStories(
    @GetUser('id') userId: string,
    @Query() filters: GetStoriesDto,
  ): Promise<{
    success: boolean;
    data: Story[];
  }> {
    const result = await this.storiesService.getMyStories(userId, filters);

    return {
      success: true,
      data: result.stories,
    };
  }

  @Get('highlights/me')
  @ApiOperation({ summary: "Get current user's highlights" })
  @ApiResponse({ status: 200, description: "Returns user's highlights" })
  async getMyHighlights(@GetUser('id') userId: string): Promise<{
    success: boolean;
    data: Story[];
  }> {
    const highlights = await this.storiesService.getHighlights(userId);

    return {
      success: true,
      data: highlights,
    };
  }

  @Get('stats/me')
  @ApiOperation({ summary: "Get current user's stories statistics" })
  @ApiResponse({ status: 200, description: 'Returns user stories stats' })
  async getMyStats(@GetUser('id') userId: string): Promise<{
    success: boolean;
    data: {
      totalStories: number;
      activeStories: number;
      totalViews: number;
      totalReplies: number;
      highlightsCount: number;
    };
  }> {
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
    @GetUser('id') viewerId: string,
    @Param('userId') userId: string,
  ): Promise<{
    success: boolean;
    data: Story[];
  }> {
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
    @GetUser('id') viewerId: string,
    @Param('id') storyId: string,
  ): Promise<{
    success: boolean;
    data: Story;
  }> {
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
    @GetUser('id') userId: string,
    @Param('id') storyId: string,
    @Body() updateStoryDto: UpdateStoryDto,
  ): Promise<{
    success: boolean;
    data: Story;
  }> {
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
    @GetUser('id') userId: string,
    @Param('id') storyId: string,
  ): Promise<void> {
    await this.storiesService.deleteStory(storyId, userId);
  }

  @Post(':id/view')
  @ApiOperation({ summary: 'View a story (record view)' })
  @ApiResponse({ status: 201, description: 'Story view recorded' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  async viewStory(
    @GetUser('id') viewerId: string,
    @Param('id') storyId: string,
  ): Promise<{
    success: boolean;
    data: StoryView;
  }> {
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
    @GetUser('id') userId: string,
    @Param('id') storyId: string,
  ): Promise<{
    success: boolean;
    data: StoryView[];
  }> {
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
    @GetUser('id') senderId: string,
    @Param('id') storyId: string,
    @Body() createStoryReplyDto: CreateStoryReplyDto,
  ): Promise<{
    success: boolean;
    data: StoryReply;
  }> {
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
    @GetUser('id') userId: string,
    @Param('id') storyId: string,
  ): Promise<{
    success: boolean;
    data: StoryReply[];
  }> {
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
    @GetUser('id') userId: string,
    @Param('replyId') replyId: string,
  ): Promise<{
    success: boolean;
    data: StoryReply;
  }> {
    const reply = await this.storiesService.markReplyAsRead(replyId, userId);

    return {
      success: true,
      data: reply,
    };
  }
}
