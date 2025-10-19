import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { Call } from './entities/call.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Call])],
  providers: [CallsService],
  controllers: [CallsController],
  exports: [CallsService],
})
export class CallsModule {}
