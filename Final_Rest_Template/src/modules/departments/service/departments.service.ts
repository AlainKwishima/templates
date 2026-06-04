import { AppError } from '../../../utils/AppError';
import { buildPaginatedResult, paginate, PaginatedResult } from '../../../utils/pagination';
import { departmentsRepository } from '../repository/departments.repository';
import { PaginationQuery } from '../../../shared/zod/common.schemas';
import { Department } from '@prisma/client';

export class DepartmentsService {
  async getAll(query: PaginationQuery): Promise<PaginatedResult<Department>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { skip, take } = paginate({ page, limit });
    const [departments, total] = await departmentsRepository.findAll({
      skip,
      take,
      search: query.search,
    });
    return buildPaginatedResult(departments, total, { page, limit });
  }

  async getById(id: string) {
    const dept = await departmentsRepository.findById(id);
    if (!dept) {
      throw new AppError('Department not found', 404);
    }
    return dept;
  }

  async create(data: { name: string; description?: string }) {
    try {
      return await departmentsRepository.create(data);
    } catch {
      throw new AppError('Department name already exists', 409);
    }
  }

  async update(id: string, data: { name?: string; description?: string | null }) {
    await this.getById(id);
    try {
      return await departmentsRepository.update(id, data);
    } catch {
      throw new AppError('Department name already exists', 409);
    }
  }

  async delete(id: string) {
    await this.getById(id);
    const resourceCount = await departmentsRepository.countResources(id);
    if (resourceCount > 0) {
      throw new AppError('Cannot delete department with associated resources', 409);
    }
    await departmentsRepository.remove(id);
  }
}

export const departmentsService = new DepartmentsService();
