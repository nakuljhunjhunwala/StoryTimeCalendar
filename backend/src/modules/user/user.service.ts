import { UserModel } from './user.model';
import { UpdateUserDto } from './user.dto';
import { ApiError } from '@/shared/utils/api-error.util';
import { StatusCodes } from '@/shared/constants/http-status.constants';

export class UserService {
  private userModel = new UserModel();

  public async getUserById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new ApiError('User not found', StatusCodes.NOT_FOUND);
    }
    return user;
  }

  public async getAllUsers(page = 1, limit = 10) {
    const { users, total } = await this.userModel.findAll(page, limit);
    return {
      users,
      total,
      page,
      limit,
    };
  }

  public async updateUser(id: string, data: UpdateUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new ApiError('User not found', StatusCodes.NOT_FOUND);
    }

    const updatedUser = await this.userModel.update(id, data);
    return updatedUser;
  }

  public async deleteUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new ApiError('User not found', StatusCodes.NOT_FOUND);
    }

    await this.userModel.delete(id);
  }

  public async getUserByEmail(email: string) {
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw new ApiError('User not found', StatusCodes.NOT_FOUND);
    }
    return user;
  }
}
