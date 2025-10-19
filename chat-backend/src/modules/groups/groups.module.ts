import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { ConversationsModule } from '@modules/conversations/conversations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember]),
    ConversationsModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
