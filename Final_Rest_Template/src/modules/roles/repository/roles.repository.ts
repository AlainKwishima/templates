import prisma from '../../../config/database';

export class RolesRepository {
  findAll() {
    return prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string) {
    return prisma.role.findUnique({ where: { id } });
  }

  findByName(name: string) {
    return prisma.role.findUnique({ where: { name } });
  }

  create(data: { name: string; description?: string }) {
    return prisma.role.create({ data });
  }

  update(id: string, data: { name?: string; description?: string | null }) {
    return prisma.role.update({ where: { id }, data });
  }

  async delete(id: string) {
    const userCount = await prisma.user.count({ where: { roleId: id } });
    return { userCount };
  }

  remove(id: string) {
    return prisma.role.delete({ where: { id } });
  }
}

export const rolesRepository = new RolesRepository();
