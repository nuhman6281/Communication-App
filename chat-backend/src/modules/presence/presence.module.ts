import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PresenceController } from './presence.controller';
import { PresenceService } from './presence.service';
import { PresenceGateway } from './presence.gateway';
import { Presence } from './entities/presence.entity';
import { TypingIndicator } from './entities/typing-indicator.entity';
import { WsJwtGuard } from '@modules/auth/guards/ws-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Presence, TypingIndicator]),
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
        },
      }),
    }),
  ],
  controllers: [PresenceController],
  providers: [PresenceService, PresenceGateway, WsJwtGuard],
  exports: [PresenceService],
})
export class PresenceModule {}
