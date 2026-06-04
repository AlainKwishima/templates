import prisma from '../../../config/database';
import { toUserPublic } from '../../../utils/userMapper';

export class ReportsService {
  async getUserReport() {
    const [totalUsers, byRoleRaw, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['roleId'],
        _count: { id: true },
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { role: true },
      }),
    ]);

    const roles = await prisma.role.findMany();
    const roleMap = new Map(roles.map((r) => [r.id, r.name]));

    const byRole = byRoleRaw.map((item) => ({
      role: roleMap.get(item.roleId) ?? 'Unknown',
      count: item._count.id,
    }));

    return {
      totalUsers,
      byRole,
      recentUsers: recentUsers.map(toUserPublic),
    };
  }

  async getResourceReport() {
    const [totalResources, byStatus, byDepartmentRaw, recentResources] = await Promise.all([
      prisma.resource.count(),
      prisma.resource.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.resource.groupBy({
        by: ['departmentId'],
        _count: { id: true },
      }),
      prisma.resource.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { department: { select: { name: true } } },
      }),
    ]);

    const departments = await prisma.department.findMany();
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));

    return {
      totalResources,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byDepartment: byDepartmentRaw.map((d) => ({
        department: deptMap.get(d.departmentId) ?? 'Unknown',
        count: d._count.id,
      })),
      recentResources: recentResources.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        status: r.status,
        departmentName: r.department.name,
        createdAt: r.createdAt,
      })),
    };
  }

  async getTransactionReport() {
    const [totalTransactions, byStatus, recentTransactions] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          resource: { select: { name: true } },
        },
      }),
    ]);

    return {
      totalTransactions,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        userName: `${t.user.firstName} ${t.user.lastName}`,
        resourceName: t.resource.name,
        status: t.status,
        transactionDate: t.transactionDate,
        createdAt: t.createdAt,
      })),
    };
  }

  async getDepartmentReport() {
    const totalDepartments = await prisma.department.count();
    const departments = await prisma.department.findMany({
      include: { _count: { select: { resources: true } } },
    });

    return {
      totalDepartments,
      resourceCountPerDepartment: departments.map((d) => ({
        department: d.name,
        resourceCount: d._count.resources,
      })),
    };
  }
}

export const reportsService = new ReportsService();
