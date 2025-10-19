import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Presence, PresenceStatus } from './entities/presence.entity';
import { TypingIndicator } from './entities/typing-indicator.entity';
import { UpdatePresenceDto } from './dto/update-presence.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PresenceService {
  constructor(
    @InjectRepository(Presence)
    private readonly presenceRepository: Repository<Presence>,
    @InjectRepository(TypingIndicator)
    private readonly typingIndicatorRepository: Repository<TypingIndicator>,
  ) {}

  /**
   * Get or create user presence
   */
  async getOrCreatePresence(userId: string): Promise<Presence> {
    let presence = await this.presenceRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!presence) {
      presence = this.presenceRepository.create({
        userId,
        status: PresenceStatus.OFFLINE,
        lastSeenAt: new Date(),
      });
      await this.presenceRepository.save(presence);
    }

    return presence;
  }

  /**
   * Update user presence status
   */
  async updatePresence(
    userId: string,
    updateDto: UpdatePresenceDto,
  ): Promise<Presence> {
    const presence = await this.getOrCreatePresence(userId);

    if (updateDto.status) {
      presence.status = updateDto.status;
    }

    if (updateDto.customStatus !== undefined) {
      presence.customStatus = updateDto.customStatus;
    }

    presence.lastSeenAt = new Date();

    await this.presenceRepository.save(presence);

    return this.presenceRepository.findOne({
      where: { userId },
      relations: ['user'],
    }) as Promise<Presence>;
  }

  /**
   * Set user online
   */
  async setOnline(
    userId: string,
    deviceId: string,
    deviceType: 'web' | 'mobile' | 'desktop',
  ): Promise<Presence> {
    const presence = await this.getOrCreatePresence(userId);

    presence.status = PresenceStatus.ONLINE;
    presence.lastSeenAt = new Date();
    presence.showAsAway = false;
    presence.awayAt = null;

    // Update or add device
    const devices = presence.devices || [];
    const existingDeviceIndex = devices.findIndex(
      (d) => d.deviceId === deviceId,
    );

    if (existingDeviceIndex >= 0) {
      devices[existingDeviceIndex].lastActive = new Date();
    } else {
      devices.push({
        deviceId,
        type: deviceType,
        lastActive: new Date(),
      });
    }

    presence.devices = devices;

    await this.presenceRepository.save(presence);

    return this.presenceRepository.findOne({
      where: { userId },
      relations: ['user'],
    }) as Promise<Presence>;
  }

  /**
   * Set user offline
   */
  async setOffline(userId: string, deviceId?: string): Promise<Presence> {
    const presence = await this.getOrCreatePresence(userId);

    if (deviceId) {
      // Remove specific device
      const devices = presence.devices || [];
      presence.devices = devices.filter((d) => d.deviceId !== deviceId);

      // If no devices left, set offline
      if (presence.devices.length === 0) {
        presence.status = PresenceStatus.OFFLINE;
      }
    } else {
      // Remove all devices and set offline
      presence.status = PresenceStatus.OFFLINE;
      presence.devices = [];
    }

    presence.lastSeenAt = new Date();

    await this.presenceRepository.save(presence);

    return this.presenceRepository.findOne({
      where: { userId },
      relations: ['user'],
    }) as Promise<Presence>;
  }

  /**
   * Update last activity for a device
   */
  async updateActivity(userId: string, deviceId: string): Promise<void> {
    const presence = await this.getOrCreatePresence(userId);

    const devices = presence.devices || [];
    const device = devices.find((d) => d.deviceId === deviceId);

    if (device) {
      device.lastActive = new Date();
      presence.devices = devices;
      presence.lastSeenAt = new Date();

      // Reset away status if active
      if (presence.showAsAway) {
        presence.showAsAway = false;
        presence.awayAt = null;
        if (presence.status === PresenceStatus.AWAY) {
          presence.status = PresenceStatus.ONLINE;
        }
      }

      await this.presenceRepository.save(presence);
    }
  }

  /**
   * Get presence for multiple users
   */
  async getPresenceForUsers(userIds: string[]): Promise<Presence[]> {
    return this.presenceRepository
      .createQueryBuilder('presence')
      .where('presence.userId IN (:...userIds)', { userIds })
      .leftJoinAndSelect('presence.user', 'user')
      .getMany();
  }

  /**
   * Start typing indicator
   */
  async startTyping(
    userId: string,
    conversationId: string,
  ): Promise<TypingIndicator> {
    // Remove existing typing indicator if any
    await this.typingIndicatorRepository.delete({
      userId,
      conversationId,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10000); // 10 seconds

    const typingIndicator = this.typingIndicatorRepository.create({
      userId,
      conversationId,
      startedAt: now,
      expiresAt,
      isTyping: true,
    });

    return this.typingIndicatorRepository.save(typingIndicator);
  }

  /**
   * Stop typing indicator
   */
  async stopTyping(userId: string, conversationId: string): Promise<void> {
    await this.typingIndicatorRepository.delete({
      userId,
      conversationId,
    });
  }

  /**
   * Get typing users in a conversation
   */
  async getTypingUsers(conversationId: string): Promise<TypingIndicator[]> {
    const now = new Date();

    return this.typingIndicatorRepository
      .createQueryBuilder('indicator')
      .where('indicator.conversationId = :conversationId', { conversationId })
      .andWhere('indicator.expiresAt > :now', { now })
      .andWhere('indicator.isTyping = :isTyping', { isTyping: true })
      .leftJoinAndSelect('indicator.user', 'user')
      .getMany();
  }

  /**
   * Cleanup expired typing indicators (runs every minute)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredTypingIndicators(): Promise<void> {
    const now = new Date();
    await this.typingIndicatorRepository.delete({
      expiresAt: LessThan(now),
    });
  }

  /**
   * Auto-set users as away based on inactivity (runs every 5 minutes)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoSetAwayStatus(): Promise<void> {
    const presences = await this.presenceRepository.find({
      where: { status: PresenceStatus.ONLINE },
    });

    const now = new Date();

    for (const presence of presences) {
      if (!presence.devices || presence.devices.length === 0) {
        continue;
      }

      // Check if all devices are inactive
      const allInactive = presence.devices.every((device) => {
        const inactiveMs =
          now.getTime() - new Date(device.lastActive).getTime();
        return inactiveMs > presence.awayTimeoutSeconds * 1000;
      });

      if (allInactive && !presence.showAsAway) {
        presence.status = PresenceStatus.AWAY;
        presence.showAsAway = true;
        presence.awayAt = now;
        await this.presenceRepository.save(presence);
      }
    }
  }
}
