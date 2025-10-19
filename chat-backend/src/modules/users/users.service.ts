import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserSettings } from './entities/user-settings.entity';
import { BlockedUser } from './entities/blocked-users.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { BlockUserDto } from './dto/block-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>,
    @InjectRepository(BlockedUser)
    private readonly blockedUserRepository: Repository<BlockedUser>,
  ) {}

  /**
   * Get current user with settings
   */
  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive fields
    const { passwordHash, mfaSecret, ...userWithoutSensitiveData } = user;

    return userWithoutSensitiveData;
  }

  /**
   * Get user by ID (public profile view)
   */
  async getUserById(userId: string, requestingUserId?: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'avatarUrl',
        'bio',
        'status',
        'isOnline',
        'lastSeen',
        'presenceStatus',
        'createdAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if requesting user is blocked
    if (requestingUserId) {
      const isBlocked = await this.isUserBlocked(userId, requestingUserId);
      if (isBlocked) {
        throw new BadRequestException('You cannot view this user profile');
      }
    }

    // Check privacy settings
    if (requestingUserId && requestingUserId !== userId) {
      const settings = await this.getUserSettings(userId);

      // Apply privacy filters based on settings
      if (settings.profileVisibility === 'nobody') {
        throw new BadRequestException('This user profile is private');
      }

      // TODO: Check if users are contacts when profileVisibility === 'contacts'
      // This will be implemented when Contacts module is ready
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if phone is already taken (if provided)
    if (updateUserDto.phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone: updateUserDto.phone, id: Not(userId) },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already in use');
      }
    }

    // Update user fields
    Object.assign(user, updateUserDto);

    await this.userRepository.save(user);

    const { passwordHash, mfaSecret, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(
      updatePasswordDto.newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash and update password
    user.passwordHash = await bcrypt.hash(updatePasswordDto.newPassword, 12);
    await this.userRepository.save(user);

    // TODO: Revoke all refresh tokens when password is changed
    // This will be handled by AuthService

    return { message: 'Password updated successfully' };
  }

  /**
   * Get user settings (create if doesn't exist)
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    let settings = await this.userSettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      // Create default settings
      settings = this.userSettingsRepository.create({ userId });
      await this.userSettingsRepository.save(settings);
    }

    return settings;
  }

  /**
   * Update user settings
   */
  async updateSettings(userId: string, updateSettingsDto: UpdateSettingsDto) {
    let settings = await this.getUserSettings(userId);

    // Update settings
    Object.assign(settings, updateSettingsDto);

    await this.userSettingsRepository.save(settings);

    return settings;
  }

  /**
   * Search users
   */
  async searchUsers(searchUsersDto: SearchUsersDto, requestingUserId?: string) {
    const { query, page = 1, limit = 20 } = searchUsersDto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.avatarUrl',
        'user.bio',
        'user.isOnline',
        'user.presenceStatus',
      ])
      .where('user.isVerified = :isVerified', { isVerified: true });

    // Apply search query
    if (query) {
      queryBuilder.andWhere(
        '(user.username ILIKE :query OR user.email ILIKE :query OR user.firstName ILIKE :query OR user.lastName ILIKE :query)',
        { query: `%${query}%` },
      );
    }

    // Exclude current user
    if (requestingUserId) {
      queryBuilder.andWhere('user.id != :userId', { userId: requestingUserId });

      // Exclude blocked users
      const blockedUserIds = await this.getBlockedUserIds(requestingUserId);
      if (blockedUserIds.length > 0) {
        queryBuilder.andWhere('user.id NOT IN (:...blockedUserIds)', { blockedUserIds });
      }
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Block a user
   */
  async blockUser(
    blockerId: string,
    blockedId: string,
    blockUserDto?: BlockUserDto,
  ) {
    // Validate users exist
    const blocker = await this.userRepository.findOne({ where: { id: blockerId } });
    const blocked = await this.userRepository.findOne({ where: { id: blockedId } });

    if (!blocker || !blocked) {
      throw new NotFoundException('User not found');
    }

    // Cannot block yourself
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    // Check if already blocked
    const existingBlock = await this.blockedUserRepository.findOne({
      where: { blockerId, blockedId },
    });

    if (existingBlock) {
      throw new ConflictException('User is already blocked');
    }

    // Create block record
    const blockRecord = this.blockedUserRepository.create({
      blockerId,
      blockedId,
      reason: blockUserDto?.reason,
      reportSubmitted: blockUserDto?.reportSubmitted || false,
      reportCategory: blockUserDto?.reportCategory,
    });

    await this.blockedUserRepository.save(blockRecord);

    // TODO: Remove from contacts, leave shared groups, etc.
    // This will be implemented when Conversations/Groups modules are ready

    return { message: 'User blocked successfully' };
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string) {
    const blockRecord = await this.blockedUserRepository.findOne({
      where: { blockerId, blockedId },
    });

    if (!blockRecord) {
      throw new NotFoundException('User is not blocked');
    }

    await this.blockedUserRepository.remove(blockRecord);

    return { message: 'User unblocked successfully' };
  }

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(userId: string) {
    const blockedRecords = await this.blockedUserRepository.find({
      where: { blockerId: userId },
      relations: ['blocked'],
      select: {
        id: true,
        blockedId: true,
        reason: true,
        createdAt: true,
        blocked: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    });

    return blockedRecords.map(record => ({
      id: record.id,
      user: record.blocked,
      reason: record.reason,
      blockedAt: record.createdAt,
    }));
  }

  /**
   * Check if a user is blocked
   */
  async isUserBlocked(userId: string, potentiallyBlockedUserId: string): Promise<boolean> {
    const blockRecord = await this.blockedUserRepository.findOne({
      where: [
        { blockerId: userId, blockedId: potentiallyBlockedUserId },
        { blockerId: potentiallyBlockedUserId, blockedId: userId },
      ],
    });

    return !!blockRecord;
  }

  /**
   * Get all blocked user IDs for a user (helper method)
   */
  private async getBlockedUserIds(userId: string): Promise<string[]> {
    const blockedRecords = await this.blockedUserRepository.find({
      where: [
        { blockerId: userId },
        { blockedId: userId },
      ],
      select: ['blockerId', 'blockedId'],
    });

    const blockedIds = new Set<string>();
    blockedRecords.forEach(record => {
      if (record.blockerId === userId) {
        blockedIds.add(record.blockedId);
      } else {
        blockedIds.add(record.blockerId);
      }
    });

    return Array.from(blockedIds);
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete (sets deletedAt timestamp)
    await this.userRepository.softRemove(user);

    // TODO: Handle cleanup - anonymize messages, leave groups, etc.
    // This will be implemented when other modules are ready

    return { message: 'Account deleted successfully' };
  }
}
