import { Response } from 'express';
import { asyncHandler, ResponseUtil } from '@/shared/utils';
import { AuthService } from './auth.service';
import {
  AISettingsDto,
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  UserProfileDto,
} from './auth.dto';
import { StatusCodes } from '@/shared/constants';
import { AuthenticatedRequest } from '@/shared/middlewares';

export class AuthController {
  private authService = new AuthService();

  /**
   * User registration for StoryTime Calendar
   */
  public register = asyncHandler(async (req: any, res: Response) => {
    const registerDto: RegisterDto = req.body;
    const tokens = await this.authService.register(registerDto);
    ResponseUtil.success(
      res,
      tokens,
      'Registration successful! Welcome to StoryTime Calendar',
      StatusCodes.CREATED,
    );
  });

  /**
   * User login
   */
  public login = asyncHandler(async (req: any, res: Response) => {
    const loginDto: LoginDto = req.body;
    const tokens = await this.authService.login(loginDto);
    ResponseUtil.success(res, tokens, 'Login successful');
  });

  /**
   * Get current user information
   */
  public getCurrentUser = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user!;
    const user = await this.authService.getCurrentUser(userId);

    // Don't return password and encrypted API key, but include API key status
    const { password, aiApiKey, ...safeUser } = user;

    // Add API key status flag
    const userWithApiKeyStatus = {
      ...safeUser,
      hasApiKey: !!aiApiKey,
    };

    ResponseUtil.success(
      res,
      userWithApiKeyStatus,
      'User information retrieved',
    );
  }) as any;

  /**
   * Update user profile
   */
  public updateProfile = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user!;
    const profileDto: UserProfileDto = req.body;

    const user = await this.authService.updateProfile(userId, profileDto);

    // Don't return password and encrypted API key, but include API key status
    const { password, aiApiKey, ...safeUser } = user;

    // Add API key status flag
    const userWithApiKeyStatus = {
      ...safeUser,
      hasApiKey: !!aiApiKey,
    };

    ResponseUtil.success(
      res,
      userWithApiKeyStatus,
      'Profile updated successfully',
    );
  }) as any;

  /**
   * Update AI settings
   */
  public updateAISettings = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user!;
    const aiSettingsDto: AISettingsDto = req.body;

    const user = await this.authService.updateAISettings(userId, aiSettingsDto);

    // Don't return password and encrypted API key, but include API key status
    const { password, aiApiKey, ...safeUser } = user;

    // Add API key status flag and show last 4 characters if API key exists
    const userWithApiKeyStatus = {
      ...safeUser,
      hasApiKey: !!aiApiKey,
      apiKeyPreview: aiApiKey ? `••••••••••••${aiApiKey.slice(-4)}` : null,
    };

    ResponseUtil.success(
      res,
      userWithApiKeyStatus,
      'AI settings updated successfully',
    );
  }) as any;

  /**
   * Change password
   */
  public changePassword = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user!;
    const changePasswordDto: ChangePasswordDto = req.body;

    await this.authService.changePassword(userId, changePasswordDto);

    ResponseUtil.success(res, null, 'Password changed successfully');
  }) as any;

  /**
   * Logout current user
   */
  public logout = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.user!;
    await this.authService.logout(userId);
    ResponseUtil.success(res, null, 'Logout successful');
  }) as any;

  /**
   * Refresh access token
   */
  public refreshAccessToken = asyncHandler(async (req: any, res: Response) => {
    const { refreshToken }: RefreshTokenDto = req.body;
    const tokens = await this.authService.refreshAccessToken(refreshToken);
    ResponseUtil.success(res, tokens, 'Access token refreshed successfully');
  });
}
