import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AuthModule } from '@modules/auth/auth.module';
import { User } from '@modules/users/entities/user.entity';
import { PremiumGuard } from '@common/guards/premium.guard';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User]), // Import User repository for PremiumGuard
  ],
  providers: [AiService, PremiumGuard],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
