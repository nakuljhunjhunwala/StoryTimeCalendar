import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '@/database/db';
import {
  AISettingsDto,
  AuthTokens,
  ChangePasswordDto,
  JwtPayload,
  LoginDto,
  RegisterDto,
  UserProfileDto,
} from './auth.dto';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';
import { env } from '@/shared/config/env.config';
import { logger } from '@/shared/utils';
import { User } from '@prisma/client';

export class AuthService {
  /**
   * User Registration for StoryTime Calendar
   */
  public async register(data: RegisterDto): Promise<AuthTokens> {
    try {
      // 1. Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ApiError(
          'User with this email already exists',
          StatusCodes.CONFLICT,
        );
      }

      // 2. Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);

      // 3. Create user
      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: passwordHash,
          name: data.name,
          age: data.age,
          gender: data.gender,
          selectedTheme: data.selectedTheme || 'FANTASY',
          timezone: data.timezone || 'UTC',
          aiProvider: 'GEMINI', // Default AI provider
        },
      });

      // 4. Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user.id);

      logger.info(`User registered successfully: ${user.id}`);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          selectedTheme: user.selectedTheme,
          aiProvider: user.aiProvider,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      logger.error('Registration failed', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Registration failed',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * User Login
   */
  public async login(data: LoginDto): Promise<AuthTokens> {
    try {
      // 1. Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (!user?.password) {
        throw new ApiError(
          'Invalid email or password',
          StatusCodes.UNAUTHORIZED,
        );
      }

      // 2. Check if user is active
      if (!user.isActive) {
        throw new ApiError('Account is deactivated', StatusCodes.UNAUTHORIZED);
      }

      // 3. Verify password
      const isValidPassword = await bcrypt.compare(
        data.password,
        user.password,
      );
      if (!isValidPassword) {
        throw new ApiError(
          'Invalid email or password',
          StatusCodes.UNAUTHORIZED,
        );
      }

      // 4. Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user.id);

      // 5. Update last sync (using updatedAt as last activity)
      await prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: new Date() },
      });

      logger.info(`User logged in successfully: ${user.id}`);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          selectedTheme: user.selectedTheme,
          aiProvider: user.aiProvider,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      logger.error('Login failed', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Authentication failed', StatusCodes.UNAUTHORIZED);
    }
  }

  /**
   * Refresh Access Token
   */
  public async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Note: Since we don't have a refresh_tokens table in our schema,
      // we'll implement a simple JWT-based refresh token system
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user?.isActive) {
        throw new ApiError(
          'User not found or inactive',
          StatusCodes.UNAUTHORIZED,
        );
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = await this.generateRefreshToken(user.id);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          selectedTheme: user.selectedTheme,
          aiProvider: user.aiProvider,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      logger.error('Failed to refresh access token', error);
      if (
        error instanceof jwt.JsonWebTokenError ||
        error instanceof jwt.TokenExpiredError
      ) {
        throw new ApiError(
          'Invalid or expired refresh token',
          StatusCodes.UNAUTHORIZED,
        );
      }
      throw new ApiError(
        'Failed to refresh access token',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Logout user (in our simple system, just return success)
   */
  public async logout(userId: string): Promise<void> {
    try {
      logger.info(`User ${userId} logged out successfully`);
    } catch (error) {
      logger.error('Failed to logout user', error);
      throw new ApiError('Failed to logout', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get current user info
   */
  public async getCurrentUser(userId: string): Promise<User> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new ApiError('User not found', StatusCodes.NOT_FOUND);
      }

      return user;
    } catch (error) {
      logger.error('Failed to get current user', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Failed to get user info',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(
    userId: string,
    data: UserProfileDto,
  ): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      logger.info(`User profile updated: ${userId}`);
      return user;
    } catch (error) {
      logger.error('Failed to update user profile', error);
      throw new ApiError(
        'Failed to update profile',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update AI settings
   */
  public async updateAISettings(
    userId: string,
    data: AISettingsDto,
  ): Promise<User> {
    try {
      // Encrypt API key if provided
      let encryptedApiKey = undefined;
      if (data.aiApiKey) {
        encryptedApiKey = this.encryptApiKey(data.aiApiKey);
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          aiApiKey: encryptedApiKey,
          aiProvider: data.aiProvider,
          aiModel: data.aiModel,
          updatedAt: new Date(),
        },
      });

      logger.info(`AI settings updated for user: ${userId}`);
      return user;
    } catch (error) {
      logger.error('Failed to update AI settings', error);
      throw new ApiError(
        'Failed to update AI settings',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Change password
   */
  public async changePassword(
    userId: string,
    data: ChangePasswordDto,
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.password) {
        throw new ApiError('User not found', StatusCodes.NOT_FOUND);
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        data.currentPassword,
        user.password,
      );
      if (!isValidPassword) {
        throw new ApiError(
          'Invalid current password',
          StatusCodes.UNAUTHORIZED,
        );
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(data.newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: newPasswordHash,
          updatedAt: new Date(),
        },
      });

      logger.info(`Password changed for user ${userId}`);
    } catch (error) {
      logger.error('Failed to change password', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Failed to change password',
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate Access Token
   */
  private generateAccessToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    const expirationInSeconds = this.parseExpirationToSeconds(
      env.JWT_ACCESS_TOKEN_EXPIRATION,
    );
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: expirationInSeconds,
    });
  }

  /**
   * Generate Refresh Token
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    const payload = { userId };
    const expirationInSeconds = this.parseExpirationToSeconds(
      env.JWT_REFRESH_TOKEN_EXPIRATION,
    );

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: expirationInSeconds,
    });
  }

  /**
   * Parse expiration string to seconds
   */
  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiration format: ${expiration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        throw new Error(`Invalid expiration unit: ${unit}`);
    }
  }

  /**
   * Encrypt API key
   */
  private encryptApiKey(apiKey: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt API key
   */
  public decryptApiKey(encryptedApiKey: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');

    const [ivHex, authTagHex, encrypted] = encryptedApiKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
