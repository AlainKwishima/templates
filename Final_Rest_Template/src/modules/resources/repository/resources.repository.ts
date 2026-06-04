import prisma from '../../../config/database';
import { Prisma, ResourceStatus } from '@prisma/client';

export type ResourceFindParams = {
  skip: number;
  take: number;
  search?: string;
  departmentId?: string;
  status?: ResourceStatus;
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
};

export class ResourcesRepository {
  async findAll(params: ResourceFindParams) {
    const where: Prisma.ResourceWhereInput = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.departmentId) {
      where.departmentId = params.departmentId;
    }
    if (params.status) {
      where.status = params.status;
    }

    const orderBy = {
      [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
    } as Prisma.ResourceOrderByWithRelationInput;

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy,
        include: { department: { select: { name: true } } },
      }),
      prisma.resource.count({ where }),
    ]);

    return [resources, total] as const;
  }

  findById(id: string) {
    return prisma.resource.findUnique({
      where: { id },
      include: { department: { select: { name: true } } },
    });
  }

  create(data: Prisma.ResourceCreateInput) {
    return prisma.resource.create({
      data,
      include: { department: { select: { name: true } } },
    });
  }

  update(id: string, data: Prisma.ResourceUpdateInput) {
    return prisma.resource.update({
      where: { id },
      data,
      include: { department: { select: { name: true } } },
    });
  }

  countTransactions(resourceId: string) {
    return prisma.transaction.count({ where: { resourceId } });
  }

  remove(id: string) {
    return prisma.resource.delete({ where: { id } });
  }
}

export const resourcesRepository = new ResourcesRepository();
