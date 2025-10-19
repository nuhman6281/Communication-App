import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { Notification } from './entities/notification.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Returns user notifications' })
  async getUserNotifications(
    @Req() req: any,
    @Query() filters: GetNotificationsDto,
  ): Promise<{
    success: boolean;
    data: {
      notifications: Notification[];
      total: number;
      unreadCount: number;
      page: number;
      limit: number;
    };
  }> {
    const userId = req.user.sub;
    const result = await this.notificationsService.getUserNotifications(
      userId,
      filters,
    );

    return {
      success: true,
      data: {
        ...result,
        page: filters.page || 1,
        limit: filters.limit || 20,
      },
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Returns unread notification count' })
  async getUnreadCount(@Req() req: any): Promise<{
    success: boolean;
    data: { count: number };
  }> {
    const userId = req.user.sub;
    const count = await this.notificationsService.getUnreadCount(userId);

    return {
      success: true,
      data: { count },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single notification by ID' })
  @ApiResponse({ status: 200, description: 'Returns the notification' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  async getNotification(
    @Req() req: any,
    @Param('id') notificationId: string,
  ): Promise<{
    success: boolean;
    data: Notification;
  }> {
    const userId = req.user.sub;
    const notification = await this.notificationsService.getNotification(
      notificationId,
      userId,
    );

    return {
      success: true,
      data: notification,
    };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Req() req: any,
    @Param('id') notificationId: string,
  ): Promise<{
    success: boolean;
    data: Notification;
  }> {
    const userId = req.user.sub;
    const notification = await this.notificationsService.markAsRead(
      notificationId,
      userId,
    );

    return {
      success: true,
      data: notification,
    };
  }

  @Put('read-multiple')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({ status: 204, description: 'Notifications marked as read' })
  async markMultipleAsRead(
    @Req() req: any,
    @Body() body: { notificationIds: string[] },
  ): Promise<void> {
    const userId = req.user.sub;
    await this.notificationsService.markMultipleAsRead(
      body.notificationIds,
      userId,
    );
  }

  @Put('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read for the user' })
  @ApiResponse({ status: 204, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req: any): Promise<void> {
    const userId = req.user.sub;
    await this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(
    @Req() req: any,
    @Param('id') notificationId: string,
  ): Promise<void> {
    const userId = req.user.sub;
    await this.notificationsService.deleteNotification(notificationId, userId);
  }

  @Delete('delete-multiple')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete multiple notifications' })
  @ApiResponse({ status: 204, description: 'Notifications deleted' })
  async deleteMultipleNotifications(
    @Req() req: any,
    @Body() body: { notificationIds: string[] },
  ): Promise<void> {
    const userId = req.user.sub;
    await this.notificationsService.deleteMultipleNotifications(
      body.notificationIds,
      userId,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all notifications for the user' })
  @ApiResponse({ status: 204, description: 'All notifications deleted' })
  async deleteAllNotifications(@Req() req: any): Promise<void> {
    const userId = req.user.sub;
    await this.notificationsService.deleteAllNotifications(userId);
  }
}
