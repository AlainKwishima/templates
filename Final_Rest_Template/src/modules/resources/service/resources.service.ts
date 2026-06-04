import { AppError } from '../../../utils/AppError';
import { buildPaginatedResult, paginate, PaginatedResult } from '../../../utils/pagination';
import prisma from '../../../config/database';
import { resourcesRepository } from '../repository/resources.repository';
import { z } from 'zod';
import { resourceQuerySchema } from '../validation/resources.schemas';

type ResourceQuery = z.infer<typeof resourceQuerySchema>;

const mapResource = (r: {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  departmentId: string;
  createdAt: Date;
  updatedAt: Date;
  department: { name: string };
}) => ({
  id: r.id,
  name: r.name,
  code: r.code,
  description: r.description,
  status: r.status,
  departmentId: r.departmentId,
  departmentName: r.department.name,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

export class ResourcesService {
  async getAll(query: ResourceQuery): Promise<PaginatedResult<ReturnType<typeof mapResource>>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { skip, take } = paginate({ page, limit });

    const [resources, total] = await resourcesRepository.findAll({
      skip,
      take,
      search: query.search,
      departmentId: query.departmentId,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return buildPaginatedResult(resources.map(mapResource), total, { page, limit });
  }

  async getById(id: string) {
    const resource = await resourcesRepository.findById(id);
    if (!resource) {
      throw new AppError('Resource not found', 404);
    }
    return mapResource(resource);
  }

  async create(data: {
    name: string;
    code: string;
    description?: string;
    status?: 'Active' | 'Inactive';
    departmentId: string;
  }) {
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) {
      throw new AppError('Department not found', 404);
    }

    try {
      const resource = await resourcesRepository.create({
        name: data.name,
        code: data.code,
        description: data.description,
        status: data.status ?? 'Active',
        department: { connect: { id: data.departmentId } },
      });
      return mapResource(resource);
    } catch {
      throw new AppError('Resource code already exists', 409);
    }
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      code: string;
      description: string | null;
      status: 'Active' | 'Inactive';
      departmentId: string;
    }>,
  ) {
    await this.getById(id);

    if (data.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!dept) {
        throw new AppError('Department not found', 404);
      }
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.departmentId) {
      delete updateData.departmentId;
      updateData.department = { connect: { id: data.departmentId } };
    }

    try {
      const resource = await resourcesRepository.update(id, updateData);
      return mapResource(resource);
    } catch {
      throw new AppError('Resource code already exists', 409);
    }
  }

  async delete(id: string) {
    await this.getById(id);
    const txCount = await resourcesRepository.countTransactions(id);
    if (txCount > 0) {
      throw new AppError('Cannot delete resource with associated transactions', 409);
    }
    await resourcesRepository.remove(id);
  }
}

export const resourcesService = new ResourcesService();
