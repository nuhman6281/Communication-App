import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, SubscriptionTier } from '@modules/users/entities/user.entity';

/**
 * Guard to check if user has an active premium subscription
 * Required for AI features (regardless of provider - OpenAI or Groq)
 */
@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Fetch user with subscription info
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'subscriptionTier', 'subscriptionExpiresAt'],
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check if user has premium tier or higher
    const hasPremiumTier = [
      SubscriptionTier.PREMIUM,
      SubscriptionTier.BUSINESS,
      SubscriptionTier.ENTERPRISE,
    ].includes(user.subscriptionTier);

    if (!hasPremiumTier) {
      throw new ForbiddenException(
        'Premium subscription required. Upgrade your plan to access AI features.',
      );
    }

    // Check if subscription is still active (not expired)
    if (user.subscriptionExpiresAt) {
      const now = new Date();
      if (user.subscriptionExpiresAt < now) {
        throw new ForbiddenException(
          'Your premium subscription has expired. Please renew to continue using AI features.',
        );
      }
    }

    // If subscription expires at is null, treat as lifetime/permanent premium
    return true;
  }
}
