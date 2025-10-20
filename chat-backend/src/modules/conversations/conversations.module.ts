import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { User } from '@modules/users/entities/user.entity';
import { BlockedUser } from '@modules/users/entities/blocked-users.entity';
import { Message } from '@modules/messages/entities/message.entity';
import { MessageReaction } from '@modules/messages/entities/message-reaction.entity';
import { ChannelSubscriber } from '@modules/channels/entities/channel-subscriber.entity';
import { Channel } from '@modules/channels/entities/channel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conversation,
      ConversationParticipant,
      User,
      BlockedUser,
      Message,
      MessageReaction,
      ChannelSubscriber,
      Channel,
    ]),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
