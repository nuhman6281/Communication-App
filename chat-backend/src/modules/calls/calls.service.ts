import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Call, CallStatus } from './entities/call.entity';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { JoinCallDto } from './dto/join-call.dto';
import { EndCallDto } from './dto/end-call.dto';
import * as crypto from 'crypto';

@Injectable()
export class CallsService {
  private jitsiUrl: string;
  private jitsiAppId: string | undefined;
  private jitsiAppSecret: string | undefined;

  constructor(
    @InjectRepository(Call)
    private callRepository: Repository<Call>,
    private configService: ConfigService,
  ) {
    this.jitsiUrl = this.configService.get<string>('JITSI_URL', 'https://meet.jit.si');
    this.jitsiAppId = this.configService.get<string>('JITSI_APP_ID');
    this.jitsiAppSecret = this.configService.get<string>('JITSI_APP_SECRET');
  }

  /**
   * Initiate a new call
   */
  async initiateCall(userId: string, initiateCallDto: InitiateCallDto): Promise<Call> {
    const { conversationId, participantIds, type, isRecorded } = initiateCallDto;

    // Generate unique Jitsi room ID
    const jitsiRoomId = this.generateJitsiRoomId();

    // Determine participants
    let participants: string[] = [userId];
    if (conversationId) {
      // For group calls, participants will be all conversation members
      participants = [userId]; // In real implementation, fetch from conversation
    } else if (participantIds) {
      participants = [userId, ...participantIds];
    }

    const call = this.callRepository.create({
      initiatorId: userId,
      conversationId,
      type,
      status: CallStatus.INITIATED,
      jitsiRoomId,
      participants,
      isRecorded: isRecorded || false,
      startedAt: new Date(),
    });

    const savedCall = await this.callRepository.save(call);

    // Load relations
    const callWithRelations = await this.callRepository.findOne({
      where: { id: savedCall.id },
      relations: ['initiator', 'conversation'],
    });

    if (!callWithRelations) {
      throw new NotFoundException('Call not found after creation');
    }

    return callWithRelations;
  }

  /**
   * Join an existing call
   */
  async joinCall(callId: string, userId: string, joinCallDto: JoinCallDto): Promise<{
    call: Call;
    jitsiConfig: any;
  }> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['initiator', 'conversation'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    // Check if call has ended
    if (call.status === CallStatus.ENDED) {
      throw new BadRequestException('Call has already ended');
    }

    // Add user to participants if not already included
    if (!call.participants.includes(userId)) {
      call.participants.push(userId);
      await this.callRepository.save(call);
    }

    // Update call status to ongoing if it was just initiated
    if (call.status === CallStatus.INITIATED) {
      call.status = CallStatus.ONGOING;
      await this.callRepository.save(call);
    }

    // Generate Jitsi configuration
    const jitsiConfig = this.generateJitsiConfig(call, userId, joinCallDto);

    return { call, jitsiConfig };
  }

  /**
   * End a call
   */
  async endCall(callId: string, userId: string, endCallDto?: EndCallDto): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    // Only initiator or participants can end the call
    if (call.initiatorId !== userId && !call.participants.includes(userId)) {
      throw new ForbiddenException('You do not have permission to end this call');
    }

    call.status = CallStatus.ENDED;
    call.endedAt = new Date();

    // Calculate duration if not provided
    if (endCallDto?.duration) {
      call.duration = endCallDto.duration;
    } else if (call.startedAt) {
      const durationMs = call.endedAt.getTime() - call.startedAt.getTime();
      call.duration = Math.floor(durationMs / 1000);
    }

    return this.callRepository.save(call);
  }

  /**
   * Get call by ID
   */
  async getCall(callId: string, userId: string): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['initiator', 'conversation'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    // Check permissions
    if (call.initiatorId !== userId && !call.participants.includes(userId)) {
      throw new ForbiddenException('You do not have access to this call');
    }

    return call;
  }

  /**
   * Get call history for a user
   */
  async getCallHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ calls: Call[]; total: number }> {
    const [calls, total] = await this.callRepository
      .createQueryBuilder('call')
      .leftJoinAndSelect('call.initiator', 'initiator')
      .leftJoinAndSelect('call.conversation', 'conversation')
      .where(
        '(call.initiatorId = :userId OR call.participants @> :userIdArray)',
        {
          userId,
          userIdArray: JSON.stringify([userId])
        }
      )
      .orderBy('call.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { calls, total };
  }

  /**
   * Generate unique Jitsi room ID
   */
  private generateJitsiRoomId(): string {
    return `room_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate Jitsi configuration for a call
   */
  private generateJitsiConfig(call: Call, userId: string, joinCallDto: JoinCallDto): any {
    const config: any = {
      roomName: call.jitsiRoomId,
      width: '100%',
      height: '100%',
      configOverwrite: {
        startWithAudioMuted: !(joinCallDto.audioEnabled ?? true),
        startWithVideoMuted: !(joinCallDto.videoEnabled ?? true),
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        enableClosePage: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'profile',
          'chat',
          'recording',
          'livestreaming',
          'etherpad',
          'sharedvideo',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'invite',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'videobackgroundblur',
          'download',
          'help',
          'mute-everyone',
          'security',
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
      },
      userInfo: {
        displayName: userId, // In real implementation, use actual user name
      },
    };

    // Add JWT token if app ID and secret are configured
    if (this.jitsiAppId && this.jitsiAppSecret) {
      config.jwt = this.generateJitsiJWT(call, userId);
    }

    return {
      ...config,
      jitsiUrl: this.jitsiUrl,
    };
  }

  /**
   * Generate Jitsi JWT token (optional, for authenticated rooms)
   */
  private generateJitsiJWT(call: Call, userId: string): string {
    // This would require jsonwebtoken package
    // For now, return placeholder
    // In production, generate proper JWT with user permissions
    return 'jwt-token-placeholder';
  }
}

