import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Message } from '@modules/messages/entities/message.entity';
import { User } from '@modules/users/entities/user.entity';
import { Conversation } from '@modules/conversations/entities/conversation.entity';
import { Channel } from '@modules/channels/entities/channel.entity';
import { Group } from '@modules/groups/entities/group.entity';
import { Media } from '@modules/media/entities/media.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      User,
      Conversation,
      Channel,
      Group,
      Media,
    ]),
  ],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
