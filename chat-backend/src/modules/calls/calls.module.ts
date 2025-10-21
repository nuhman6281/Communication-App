import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { CallsGateway } from './calls.gateway';
import { Call } from './entities/call.entity';
import { User } from '@modules/users/entities/user.entity';
import { Conversation } from '@modules/conversations/entities/conversation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Call, User, Conversation]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CallsService, CallsGateway],
  controllers: [CallsController],
  exports: [CallsService, CallsGateway],
})
export class CallsModule {}
