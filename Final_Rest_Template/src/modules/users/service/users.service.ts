import bcrypt from 'bcrypt';
import { AppError } from '../../../utils/AppError';
import { buildPaginatedResult, paginate, PaginatedResult } from '../../../utils/pagination';
import { toUserPublic, UserPublic } from '../../../utils/userMapper';
import { usersRepository } from '../repository/users.repository';
import { PaginationQuery } from '../../../shared/zod/common.schemas';

const BCRYPT_ROUNDS = 10;

export class UsersService {
  async getAll(query: PaginationQuery): Promise<PaginatedResult<UserPublic>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { skip, take } = paginate({ page, limit });
    const [users, total] = await usersRepository.findAll({
      skip,
      take,
      search: query.search,
    });

    return buildPaginatedResult(
      users.map(toUserPublic),
      total,
      { page, limit },
    );
  }

  async getById(id: string): Promise<UserPublic> {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return toUserPublic(user);
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleId: string;
  }) {
    const hashed = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    try {
      const user = await usersRepository.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashed,
        role: { connect: { id: data.roleId } },
      });
      return toUserPublic(user);
    } catch {
      throw new AppError('Email is already registered', 409);
    }
  }

  async update(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      roleId: string;
    }>,
  ) {
    await this.getById(id);
    const updateData: Record<string, unknown> = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    }
    if (data.roleId) {
      delete updateData.roleId;
      updateData.role = { connect: { id: data.roleId } };
    }

    const user = await usersRepository.update(id, updateData);
    return toUserPublic(user);
  }

  async delete(id: string) {
    await this.getById(id);
    await usersRepository.delete(id);
  }
}

export const usersService = new UsersService();
