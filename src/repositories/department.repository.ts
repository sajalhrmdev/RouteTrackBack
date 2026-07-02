import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class DepartmentRepository {
  async findById(id: string, companyId: string) {
    return prisma.department.findFirst({
      where: { id, companyId },
    });
  }

  async findByName(name: string, companyId: string) {
    return prisma.department.findFirst({
      where: { name, companyId },
    });
  }

  async findAll(companyId: string) {
    return prisma.department.findMany({
      where: { companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: Prisma.DepartmentUncheckedCreateInput) {
    return prisma.department.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.DepartmentUncheckedUpdateInput) {
    return prisma.department.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.department.deleteMany({
      where: { id, companyId },
    });
  }
}

export const departmentRepository = new DepartmentRepository();
