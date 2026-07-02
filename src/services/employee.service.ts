import { employeeRepository } from '../repositories/employee.repository';
import { NotFoundError, ConflictError } from '../utils/errors';
import { generateEmployeeId, getPaginationParams } from '../utils/helpers';
import { CreateEmployeeInput, UpdateEmployeeInput } from '../validations/employee';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';

export class EmployeeService {
  async getAll(companyId: string, query: any) {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(query);
    const { employees, total } = await employeeRepository.findAll(companyId, {
      skip,
      take: limit,
      sortBy,
      sortOrder,
      search: query.search,
      departmentId: query.departmentId,
      designationId: query.designationId,
      status: query.status,
      isOnline: query.isOnline === 'true' ? true : query.isOnline === 'false' ? false : undefined,
    });

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getById(id: string, companyId: string) {
    const employee = await employeeRepository.findById(id, companyId);
    if (!employee) {
      throw new NotFoundError('Employee');
    }
    return employee;
  }

  async create(companyId: string, data: CreateEmployeeInput) {
    const existingEmail = await employeeRepository.findByEmail(data.email, companyId);
    if (existingEmail) {
      throw new ConflictError('Employee with this email already exists');
    }

    const employeeId = generateEmployeeId();

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: await bcrypt.hash('Welcome@123', 12),
        role: 'EMPLOYEE',
        companyId,
      },
    });

    const employee = await employeeRepository.create({
      ...data,
      employeeId,
      companyId,
    });

    return employee;
  }

  async update(id: string, companyId: string, data: UpdateEmployeeInput) {
    const existing = await employeeRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Employee');
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await employeeRepository.findByEmail(data.email, companyId);
      if (emailExists) {
        throw new ConflictError('Email already in use');
      }
    }

    await employeeRepository.update(id, companyId, data);
    return employeeRepository.findById(id, companyId);
  }

  async delete(id: string, companyId: string) {
    const existing = await employeeRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundError('Employee');
    }

    await prisma.user.deleteMany({
      where: { email: existing.email, companyId },
    });

    await employeeRepository.delete(id, companyId);
  }

  async getStats(companyId: string) {
    const [total, active, inactive, online, offline] = await Promise.all([
      employeeRepository.count(companyId),
      employeeRepository.countByStatus(companyId, 'ACTIVE'),
      employeeRepository.countByStatus(companyId, 'INACTIVE'),
      employeeRepository.countByOnline(companyId, true),
      employeeRepository.countByOnline(companyId, false),
    ]);

    return { total, active, inactive, online, offline };
  }
}

export const employeeService = new EmployeeService();
