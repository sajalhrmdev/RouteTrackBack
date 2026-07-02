import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class EmployeeRepository {
  async findById(id: string, companyId: string) {
    return prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });
  }

  async findByEmployeeId(employeeId: string, companyId: string) {
    return prisma.employee.findFirst({
      where: { employeeId, companyId },
    });
  }

  async findByEmail(email: string, companyId: string) {
    return prisma.employee.findFirst({
      where: { email, companyId },
    });
  }

  async findAll(companyId: string, params: {
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    departmentId?: string;
    designationId?: string;
    status?: string;
    isOnline?: boolean;
  }) {
    const where: Prisma.EmployeeWhereInput = { companyId };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { employeeId: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.designationId) where.designationId = params.designationId;
    if (params.status) where.status = params.status as any;
    if (params.isOnline !== undefined) where.isOnline = params.isOnline;

    const orderBy: Prisma.EmployeeOrderByWithRelationInput = {
      [params.sortBy || 'createdAt']: params.sortOrder || 'desc',
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, name: true } },
          reportingManager: { select: { id: true, name: true } },
        },
        skip: params.skip,
        take: params.take,
        orderBy,
      }),
      prisma.employee.count({ where }),
    ]);

    return { employees, total };
  }

  async create(data: Prisma.EmployeeUncheckedCreateInput) {
    return prisma.employee.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.EmployeeUncheckedUpdateInput) {
    return prisma.employee.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.employee.deleteMany({
      where: { id, companyId },
    });
  }

  async count(companyId: string) {
    return prisma.employee.count({ where: { companyId } });
  }

  async countByStatus(companyId: string, status: string) {
    return prisma.employee.count({ where: { companyId, status: status as any } });
  }

  async countByOnline(companyId: string, isOnline: boolean) {
    return prisma.employee.count({ where: { companyId, isOnline } });
  }
}

export const employeeRepository = new EmployeeRepository();
