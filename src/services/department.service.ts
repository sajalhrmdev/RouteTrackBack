import { departmentRepository } from '../repositories/department.repository';
import { NotFoundError, ConflictError } from '../utils/errors';
import { CreateDepartmentInput, UpdateDepartmentInput } from '../validations/department';

export class DepartmentService {
  async getAll(companyId: string) {
    return departmentRepository.findAll(companyId);
  }

  async getById(id: string, companyId: string) {
    const department = await departmentRepository.findById(id, companyId);
    if (!department) {
      throw new NotFoundError('Department');
    }
    return department;
  }

  async create(companyId: string, data: CreateDepartmentInput) {
    const existing = await departmentRepository.findByName(data.name, companyId);
    if (existing) {
      throw new ConflictError('Department with this name already exists');
    }
    return departmentRepository.create({ ...data, companyId });
  }

  async update(id: string, companyId: string, data: UpdateDepartmentInput) {
    const existing = await departmentRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Department');
    }
    if (data.name && data.name !== existing.name) {
      const nameExists = await departmentRepository.findByName(data.name, companyId);
      if (nameExists) {
        throw new ConflictError('Department name already exists');
      }
    }
    await departmentRepository.update(id, companyId, data);
    return departmentRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    const existing = await departmentRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Department');
    }
    await departmentRepository.delete(id, companyId);
  }
}

export const departmentService = new DepartmentService();
