import { AppError } from '../../../utils/AppError';
import { rolesRepository } from '../repository/roles.repository';

export class RolesService {
  getAll() {
    return rolesRepository.findAll();
  }

  async getById(id: string) {
    const role = await rolesRepository.findById(id);
    if (!role) {
      throw new AppError('Role not found', 404);
    }
    return role;
  }

  async create(data: { name: string; description?: string }) {
    const existing = await rolesRepository.findByName(data.name);
    if (existing) {
      throw new AppError('Role name already exists', 409);
    }
    return rolesRepository.create(data);
  }

  async update(id: string, data: { name?: string; description?: string | null }) {
    await this.getById(id);
    if (data.name) {
      const existing = await rolesRepository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new AppError('Role name already exists', 409);
      }
    }
    return rolesRepository.update(id, data);
  }

  async delete(id: string) {
    await this.getById(id);
    const { userCount } = await rolesRepository.delete(id);
    if (userCount > 0) {
      throw new AppError('Cannot delete role assigned to users', 409);
    }
    await rolesRepository.remove(id);
  }
}

export const rolesService = new RolesService();
