import prisma from '../../../config/database';
import { Prisma } from '@prisma/client';

export class DepartmentsRepository {
  async findAll(params: { skip: number; take: number; search?: string }) {
    const where: Prisma.DepartmentWhereInput = params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { description: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { name: 'asc' },
      }),
      prisma.department.count({ where }),
    ]);

    return [departments, total] as const;
  }

  findById(id: string) {
    return prisma.department.findUnique({ where: { id } });
  }

  create(data: { name: string; description?: string }) {
    return prisma.department.create({ data });
  }

  update(id: string, data: { name?: string; description?: string | null }) {
    return prisma.department.update({ where: { id }, data });
  }

  async countResources(departmentId: string) {
    return prisma.resource.count({ where: { departmentId } });
  }

  remove(id: string) {
    return prisma.department.delete({ where: { id } });
  }
}

export const departmentsRepository = new DepartmentsRepository();
