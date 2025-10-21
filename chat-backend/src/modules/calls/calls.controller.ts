import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { CallsService } from './calls.service';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { JoinCallDto } from './dto/join-call.dto';
import { EndCallDto } from './dto/end-call.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';

@ApiTags('Calls')
@ApiBearerAuth()
@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  @ApiOperation({ summary: 'Initiate a new call' })
  @ApiResponse({ status: 201, description: 'Call initiated successfully' })
  async initiateCall(
    @CurrentUser('sub') userId: string,
    @Body() initiateCallDto: InitiateCallDto,
  ) {
    return this.callsService.initiateCall(userId, initiateCallDto);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join an existing call' })
  @ApiResponse({ status: 200, description: 'Joined call successfully' })
  async joinCall(
    @Param('id', ParseUUIDPipe) callId: string,
    @CurrentUser('sub') userId: string,
    @Body() joinCallDto: JoinCallDto,
  ) {
    return this.callsService.joinCall(callId, userId, joinCallDto);
  }

  @Post(':id/end')
  @ApiOperation({ summary: 'End a call' })
  @ApiResponse({ status: 200, description: 'Call ended successfully' })
  async endCall(
    @Param('id', ParseUUIDPipe) callId: string,
    @CurrentUser('sub') userId: string,
    @Body() endCallDto?: EndCallDto,
  ) {
    return this.callsService.endCall(callId, userId, endCallDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get call history' })
  @ApiResponse({ status: 200, description: 'Call history retrieved' })
  async getCallHistory(
    @CurrentUser('sub') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.callsService.getCallHistory(userId, page, limit);
  }

  @Get('missed')
  @ApiOperation({ summary: 'Get missed calls' })
  @ApiResponse({ status: 200, description: 'Missed calls retrieved' })
  async getMissedCalls(
    @CurrentUser('sub') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.callsService.getMissedCalls(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get call details' })
  @ApiResponse({ status: 200, description: 'Call details retrieved' })
  async getCall(
    @Param('id', ParseUUIDPipe) callId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.callsService.getCall(callId, userId);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept an incoming call' })
  @ApiResponse({ status: 200, description: 'Call accepted successfully' })
  async acceptCall(
    @Param('id', ParseUUIDPipe) callId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.callsService.acceptCall(callId, userId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject an incoming call' })
  @ApiResponse({ status: 200, description: 'Call rejected successfully' })
  async rejectCall(
    @Param('id', ParseUUIDPipe) callId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.callsService.rejectCall(callId, userId);
  }

  @Post(':id/missed')
  @ApiOperation({ summary: 'Mark a call as missed' })
  @ApiResponse({ status: 200, description: 'Call marked as missed' })
  async markCallAsMissed(@Param('id', ParseUUIDPipe) callId: string) {
    return this.callsService.markCallAsMissed(callId);
  }

  @Post(':id/recording')
  @ApiOperation({ summary: 'Update call recording URL and metadata' })
  @ApiResponse({ status: 200, description: 'Recording updated successfully' })
  async updateRecording(
    @Param('id', ParseUUIDPipe) callId: string,
    @Body() updateRecordingDto: UpdateRecordingDto,
  ) {
    return this.callsService.updateRecording(callId, updateRecordingDto);
  }
}

