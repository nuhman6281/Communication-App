import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Call, CallStatus, CallType } from './entities/call.entity';
import { User } from '@modules/users/entities/user.entity';
import { Conversation } from '@modules/conversations/entities/conversation.entity';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { JoinCallDto } from './dto/join-call.dto';
import { EndCallDto } from './dto/end-call.dto';
import { CallsGateway } from './calls.gateway';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class CallsService {
  private jitsiUrl: string;
  private jitsiAppId: string | undefined;
  private jitsiAppSecret: string | undefined;

  constructor(
    @InjectRepository(Call)
    private callRepository: Repository<Call>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    private configService: ConfigService,
    @Inject(forwardRef(() => CallsGateway))
    private callsGateway: CallsGateway,
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

    // Fetch the initiator user
    const initiator = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!initiator) {
      throw new NotFoundException('User not found');
    }

    // Generate unique Jitsi room ID
    const jitsiRoomId = this.generateJitsiRoomId();

    // Generate Jitsi room URL
    const jitsiRoomUrl = `${this.jitsiUrl}/${jitsiRoomId}`;

    // Determine participants
    let participants: string[] = [];
    if (conversationId) {
      // Fetch conversation with participants
      const conversation = await this.conversationRepository.findOne({
        where: { id: conversationId },
        relations: ['participants'],
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      // Extract user IDs from conversation participants
      participants = conversation.participants.map((p) => p.userId);
      console.log('[CallsService] Conversation participants:', participants);
      console.log('[CallsService] Initiator ID:', userId);
    } else if (participantIds) {
      participants = [...participantIds];
      // Add initiator to participants if not already included
      if (!participants.includes(userId)) {
        participants.push(userId);
      }
      console.log('[CallsService] Participants from participantIds:', participants);
    }

    const call = this.callRepository.create({
      initiator, // Set the relationship object
      initiatorId: userId, // Also set the ID explicitly
      conversationId,
      type,
      status: CallStatus.RINGING, // Set to ringing immediately
      jitsiRoomId,
      jitsiRoomUrl,
      participants,
      isRecorded: isRecorded || false,
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

    // Emit WebSocket event to notify participants about incoming call
    participants.forEach((participantId) => {
      this.callsGateway.emitToUser(participantId, 'call:incoming', {
        call: callWithRelations,
        initiator: callWithRelations.initiator,
        callType: type,
      });
    });

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

    const savedCall = await this.callRepository.save(call);

    // Emit WebSocket event to notify all participants that call has ended
    this.callsGateway.emitToCall(callId, 'call:ended', {
      callId,
      endedBy: userId,
      duration: savedCall.duration,
    });

    return savedCall;
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
      config.jwt = this.generateJitsiJWT(call, userId, userId); // Using userId as username for now
    }

    return {
      ...config,
      jitsiUrl: this.jitsiUrl,
    };
  }

  /**
   * Generate Jitsi JWT token for authenticated rooms
   */
  private generateJitsiJWT(call: Call, userId: string, username: string): string {
    if (!this.jitsiAppId || !this.jitsiAppSecret) {
      return ''; // No JWT if not configured
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 86400; // 24 hours

    const payload = {
      context: {
        user: {
          id: userId,
          name: username,
          avatar: '', // Can be added later
          email: '', // Optional
        },
        features: {
          livestreaming: call.isRecorded,
          recording: call.isRecorded,
          transcription: false,
          'outbound-call': false,
        },
      },
      aud: 'jitsi',
      iss: this.jitsiAppId,
      sub: this.jitsiUrl.replace(/^https?:\/\//, ''),
      room: call.jitsiRoomId,
      exp,
      nbf: now - 10, // Not before: 10 seconds ago (clock skew)
      moderator: call.initiatorId === userId, // Initiator is moderator
    };

    return jwt.sign(payload, this.jitsiAppSecret, { algorithm: 'HS256' });
  }

  /**
   * Accept an incoming call
   */
  async acceptCall(callId: string, userId: string): Promise<{
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

    // Check if user is a participant
    if (!call.participants.includes(userId) && call.initiatorId !== userId) {
      throw new ForbiddenException('You are not a participant in this call');
    }

    // Update call status to ongoing
    call.status = CallStatus.ONGOING;
    if (!call.startedAt) {
      call.startedAt = new Date();
    }

    await this.callRepository.save(call);

    // Emit WebSocket event to notify all participants
    this.callsGateway.emitToCall(callId, 'call:accepted', {
      callId,
      acceptedBy: userId,
    });

    // Generate Jitsi configuration
    const jitsiConfig = this.generateJitsiConfig(call, userId, { videoEnabled: true, audioEnabled: true });

    return { call, jitsiConfig };
  }

  /**
   * Reject an incoming call
   */
  async rejectCall(callId: string, userId: string): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    // Check if user is a participant
    if (!call.participants.includes(userId) && call.initiatorId !== userId) {
      throw new ForbiddenException('You are not a participant in this call');
    }

    call.status = CallStatus.DECLINED;
    call.endedAt = new Date();

    const savedCall = await this.callRepository.save(call);

    // Emit WebSocket event to notify all participants
    this.callsGateway.emitToCall(callId, 'call:rejected', {
      callId,
      rejectedBy: userId,
    });

    return savedCall;
  }

  /**
   * Get missed calls for a user
   */
  async getMissedCalls(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [calls, total] = await this.callRepository.findAndCount({
      where: [
        // Calls where user is in participants array and status is missed
        {
          participants: userId as any, // TypeORM will handle JSON contains
          status: CallStatus.MISSED,
        },
      ],
      relations: ['initiator', 'conversation'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items: calls,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark call as missed
   */
  async markCallAsMissed(callId: string): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['initiator', 'conversation'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    call.status = CallStatus.MISSED;
    call.endedAt = new Date();

    const savedCall = await this.callRepository.save(call);

    // Emit WebSocket event to notify participants
    if (call.participants && call.participants.length > 0) {
      for (const participantId of call.participants) {
        // Skip the initiator
        if (participantId !== call.initiatorId) {
          this.callsGateway.server.to(`user:${participantId}`).emit('call:missed', {
            callId: call.id,
            initiatorId: call.initiatorId,
            callType: call.type,
          });
        }
      }
    }

    return savedCall;
  }

  /**
   * Update call recording URL and metadata
   */
  async updateRecording(callId: string, updateData: { recordingUrl?: string; metadata?: Record<string, any> }): Promise<Call> {
    const call = await this.callRepository.findOne({
      where: { id: callId },
      relations: ['initiator', 'conversation'],
    });

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (updateData.recordingUrl) {
      call.recordingUrl = updateData.recordingUrl;
    }

    if (updateData.metadata) {
      call.metadata = {
        ...call.metadata,
        ...updateData.metadata,
      };
    }

    const savedCall = await this.callRepository.save(call);

    // Emit WebSocket event to notify participants about recording availability
    if (updateData.recordingUrl) {
      this.callsGateway.emitToCall(callId, 'recording:available', {
        callId: call.id,
        recordingUrl: updateData.recordingUrl,
      });
    }

    return savedCall;
  }
}

