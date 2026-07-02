import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class DesignationRepository {
  async findById(id: string, companyId: string) {
    return prisma.designation.findFirst({
      where: { id, companyId },
    });
  }

  async findByName(name: string, companyId: string) {
    return prisma.designation.findFirst({
      where: { name, companyId },
    });
  }

  async findAll(companyId: string) {
    return prisma.designation.findMany({
      where: { companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: Prisma.DesignationUncheckedCreateInput) {
    return prisma.designation.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.DesignationUncheckedUpdateInput) {
    return prisma.designation.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.designation.deleteMany({
      where: { id, companyId },
    });
  }
}

export const designationRepository = new DesignationRepository();
