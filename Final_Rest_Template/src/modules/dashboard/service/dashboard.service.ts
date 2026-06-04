import prisma from '../../../config/database';
import { toUserPublic } from '../../../utils/userMapper';

export class DashboardService {
  async getSummary() {
    const [
      totalUsers,
      totalResources,
      totalTransactions,
      totalDepartments,
      recentTransactions,
      recentUsers,
      departments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.resource.count(),
      prisma.transaction.count(),
      prisma.department.count(),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          resource: { select: { name: true } },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { role: true },
      }),
      prisma.department.findMany({
        include: { _count: { select: { resources: true } } },
      }),
    ]);

    return {
      totalUsers,
      totalResources,
      totalTransactions,
      totalDepartments,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        userName: `${t.user.firstName} ${t.user.lastName}`,
        resourceName: t.resource.name,
        status: t.status,
        transactionDate: t.transactionDate,
      })),
      recentUsers: recentUsers.map(toUserPublic),
      departmentStats: departments.map((d) => ({
        department: d.name,
        resourceCount: d._count.resources,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
