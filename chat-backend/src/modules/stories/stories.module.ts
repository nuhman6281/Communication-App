import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { StoriesGateway } from './stories/stories.gateway';
import { Story } from './entities/story.entity';
import { StoryView } from './entities/story-view.entity';
import { StoryReply } from './entities/story-reply.entity';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, StoryView, StoryReply]),
    ScheduleModule.forRoot(),
    forwardRef(() => NotificationsModule),
  ],
  providers: [StoriesService, StoriesGateway],
  controllers: [StoriesController],
  exports: [StoriesService, StoriesGateway],
})
export class StoriesModule {}
