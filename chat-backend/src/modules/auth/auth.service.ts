import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@modules/users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { username: registerDto.username }],
    });

    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.username === registerDto.username) {
        throw new ConflictException('Username already taken');
      }
    }

    // Hash password
    const passwordHash = await this.hashPassword(registerDto.password);

    // Create user
    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      passwordHash,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      isVerified: false, // Require email verification
    });

    await this.userRepository.save(user);

    // Generate email verification token
    const verificationToken = await this.createEmailVerificationToken(user);

    // TODO: Send verification email
    // await this.emailService.sendVerificationEmail(user.email, verificationToken.token);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
      verificationToken: verificationToken.token, // Remove in production - only for testing
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto, userAgent?: string, ipAddress?: string) {
    // Find user by email or username
    const user = await this.userRepository.findOne({
      where: [{ email: loginDto.identifier }, { username: loginDto.identifier }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!loginDto.mfaCode) {
        throw new UnauthorizedException('MFA code required');
      }

      const isMfaValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: loginDto.mfaCode,
        window: 2,
      });

      if (!isMfaValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, userAgent, ipAddress);

    // Update last seen
    user.lastSeen = new Date();
    user.isOnline = true;
    await this.userRepository.save(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string) {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, isRevoked: false },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(
      storedToken.user,
      storedToken.userAgent,
      storedToken.ipAddress,
    );

    // Revoke old refresh token (token rotation)
    storedToken.isRevoked = true;
    await this.refreshTokenRepository.save(storedToken);

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (token) {
      token.isRevoked = true;
      await this.refreshTokenRepository.save(token);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string) {
    const verification = await this.emailVerificationRepository.findOne({
      where: { token, isUsed: false },
      relations: ['user'],
    });

    if (!verification) {
      throw new BadRequestException('Invalid verification token');
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('Verification token expired');
    }

    // Mark user as verified
    verification.user.isVerified = true;
    await this.userRepository.save(verification.user);

    // Mark token as used
    verification.isUsed = true;
    await this.emailVerificationRepository.save(verification);

    return { message: 'Email verified successfully' };
  }

  /**
   * Request password reset
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = await this.createPasswordResetToken(user);

    // TODO: Send password reset email
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken.token);

    return {
      message: 'If the email exists, a password reset link has been sent',
      resetToken: resetToken.token, // Remove in production - only for testing
    };
  }

  /**
   * Reset password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const reset = await this.passwordResetRepository.findOne({
      where: { token: resetPasswordDto.token, isUsed: false },
      relations: ['user'],
    });

    if (!reset) {
      throw new BadRequestException('Invalid reset token');
    }

    if (new Date() > reset.expiresAt) {
      throw new BadRequestException('Reset token expired');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(resetPasswordDto.newPassword);

    // Update user password
    reset.user.passwordHash = passwordHash;
    await this.userRepository.save(reset.user);

    // Mark token as used
    reset.isUsed = true;
    await this.passwordResetRepository.save(reset);

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update({ userId: reset.user.id }, { isRevoked: true });

    return { message: 'Password reset successfully' };
  }

  /**
   * Setup MFA (Multi-Factor Authentication)
   */
  async setupMfa(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.mfaEnabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    // Generate MFA secret
    const secret = speakeasy.generateSecret({
      name: `ChatApp (${user.email})`,
      length: 32,
    });

    // Save secret to user (not enabled yet)
    user.mfaSecret = secret.base32;
    await this.userRepository.save(user);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      message: 'Scan the QR code with your authenticator app and verify with a code',
    };
  }

  /**
   * Enable MFA
   */
  async enableMfa(userId: string, code: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    // Enable MFA
    user.mfaEnabled = true;
    await this.userRepository.save(user);

    return { message: 'MFA enabled successfully' };
  }

  /**
   * Disable MFA
   */
  async disableMfa(userId: string, code: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    // Verify code before disabling
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code');
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = null;
    await this.userRepository.save(user);

    return { message: 'MFA disabled successfully' };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(user: User, userAgent?: string, ipAddress?: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn'),
    });

    // Generate refresh token
    const refreshTokenId = uuidv4();
    const refreshToken = this.jwtService.sign(
      { sub: user.id, tokenId: refreshTokenId },
      {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      },
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshTokenRepository.save({
      token: refreshToken,
      userId: user.id,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get('jwt.expiresIn'),
    };
  }

  /**
   * Create email verification token
   */
  private async createEmailVerificationToken(user: User) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    const verification = this.emailVerificationRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });

    return this.emailVerificationRepository.save(verification);
  }

  /**
   * Create password reset token
   */
  private async createPasswordResetToken(user: User) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    const reset = this.passwordResetRepository.create({
      token,
      userId: user.id,
      expiresAt,
    });

    return this.passwordResetRepository.save(reset);
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User) {
    const { passwordHash, mfaSecret, ...sanitized } = user;
    return sanitized;
  }
}
