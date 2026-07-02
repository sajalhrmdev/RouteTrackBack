import { designationRepository } from '../repositories/designation.repository';
import { NotFoundError, ConflictError } from '../utils/errors';
import { CreateDesignationInput, UpdateDesignationInput } from '../validations/designation';

export class DesignationService {
  async getAll(companyId: string) {
    return designationRepository.findAll(companyId);
  }

  async getById(id: string, companyId: string) {
    const designation = await designationRepository.findById(id, companyId);
    if (!designation) {
      throw new NotFoundError('Designation');
    }
    return designation;
  }

  async create(companyId: string, data: CreateDesignationInput) {
    const existing = await designationRepository.findByName(data.name, companyId);
    if (existing) {
      throw new ConflictError('Designation with this name already exists');
    }
    return designationRepository.create({ ...data, companyId });
  }

  async update(id: string, companyId: string, data: UpdateDesignationInput) {
    const existing = await designationRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Designation');
    }
    if (data.name && data.name !== existing.name) {
      const nameExists = await designationRepository.findByName(data.name, companyId);
      if (nameExists) {
        throw new ConflictError('Designation name already exists');
      }
    }
    await designationRepository.update(id, companyId, data);
    return designationRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    const existing = await designationRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Designation');
    }
    await designationRepository.delete(id, companyId);
  }
}

export const designationService = new DesignationService();
