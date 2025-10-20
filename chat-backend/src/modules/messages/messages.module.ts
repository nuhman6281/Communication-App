import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { Message } from './entities/message.entity';
import { MessageReaction } from './entities/message-reaction.entity';
import { MessageRead } from './entities/message-read.entity';
import { MessageEditHistory } from './entities/message-edit-history.entity';
import { PinnedMessage } from './entities/pinned-message.entity';
import { Conversation } from '@modules/conversations/entities/conversation.entity';
import { ConversationParticipant } from '@modules/conversations/entities/conversation-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      MessageReaction,
      MessageRead,
      MessageEditHistory,
      PinnedMessage,
      Conversation,
      ConversationParticipant,
    ]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
