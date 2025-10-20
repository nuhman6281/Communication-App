import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import redisStore from 'cache-manager-redis-store';
import { DatabaseModule } from '@database/database.module';
import { configuration } from '@config/configuration';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { ConversationsModule } from '@modules/conversations/conversations.module';
import { MessagesModule } from '@modules/messages/messages.module';
import { MediaModule } from '@modules/media/media.module';
import { PresenceModule } from '@modules/presence/presence.module';
import { GroupsModule } from '@modules/groups/groups.module';
import { ChannelsModule } from '@modules/channels/channels.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StoriesModule } from './modules/stories/stories.module';
import { SearchModule } from './modules/search/search.module';
import { CallsModule } from './modules/calls/calls.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AiModule } from './modules/ai/ai.module';
import { EmailModule } from './modules/email/email.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),

    // Caching
    CacheModule.register({
      isGlobal: true,
      // @ts-ignore - cache-manager-redis-store type compatibility
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      ttl: 300, // 5 minutes default
    }),

    // Message Queue
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0', 10),
      },
    }),

    // Database
    DatabaseModule,

    // Feature Modules
    EmailModule,
    AuthModule,
    UsersModule,
    ConversationsModule,
    MessagesModule,
    MediaModule,
    PresenceModule,
    GroupsModule,
    ChannelsModule,
    NotificationsModule,
    StoriesModule,
    SearchModule,
    CallsModule,
    WebhooksModule,
    AiModule,
    WorkspacesModule,
  ],
})
export class AppModule {}
