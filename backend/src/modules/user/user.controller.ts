import { Request, Response } from 'express';
import { asyncHandler } from '@/shared/utils/async-handler.util';
import { ResponseUtil } from '@/shared/utils/response.util';
import { UserService } from './user.service';
import { UpdateUserDto } from './user.dto';
import { StatusCodes } from '@/shared/constants/http-status.constants';

export class UserController {
  private userService = new UserService();

  public getUserById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const user = await this.userService.getUserById(userId);
    ResponseUtil.success(res, user);
  });

  public getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const {
      users,
      total,
      page: currentPage,
      limit: currentLimit,
    } = await this.userService.getAllUsers(page, limit);
    ResponseUtil.success(
      res,
      users,
      'Users retrieved successfully',
      StatusCodes.OK,
      {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages: Math.ceil(total / currentLimit),
      },
    );
  });

  public updateUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    const updateUserDto: UpdateUserDto = req.body;
    const user = await this.userService.updateUser(userId, updateUserDto);
    ResponseUtil.success(res, user, 'User updated successfully');
  });

  public deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id;
    await this.userService.deleteUser(userId);
    ResponseUtil.success(res, null, 'User deleted successfully');
  });

  public getUserByEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.params;
    const user = await this.userService.getUserByEmail(email);
    ResponseUtil.success(res, user);
  });
}
