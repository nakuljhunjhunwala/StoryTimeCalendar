import { prisma } from '@/database/db';
import { UpdateUserDto } from './user.dto';

export class UserModel {
  public async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  public async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  public async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);
    return { users, total };
  }

  public async update(id: string, data: UpdateUserDto) {
    return prisma.user.update({ where: { id }, data });
  }

  public async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}
