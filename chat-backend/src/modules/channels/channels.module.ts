import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { Channel } from './entities/channel.entity';
import { ChannelSubscriber } from './entities/channel-subscriber.entity';
import { ConversationsModule } from '@modules/conversations/conversations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Channel, ChannelSubscriber]),
    ConversationsModule,
  ],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
