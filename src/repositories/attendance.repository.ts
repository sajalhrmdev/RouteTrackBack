import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class AttendanceRepository {
  async findActiveAttendance(employeeId: string, companyId: string) {
    return prisma.attendance.findFirst({
      where: {
        employeeId,
        companyId,
        status: 'CHECKED_IN',
      },
    });
  }

  async findById(id: string, companyId: string) {
    return prisma.attendance.findFirst({
      where: { id, companyId },
      include: {
        employee: {
          select: {
            name: true,
            avatar: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });
  }

  async findAll(companyId: string, params: {
    skip?: number;
    take?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    employeeId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.AttendanceWhereInput = { companyId };

    if (params.employeeId) where.employeeId = params.employeeId;
    if (params.status) where.status = params.status as any;
    if (params.startDate || params.endDate) {
      where.checkInTime = {};
      if (params.startDate) where.checkInTime.gte = params.startDate;
      if (params.endDate) where.checkInTime.lte = params.endDate;
    }

    const orderBy: Prisma.AttendanceOrderByWithRelationInput = {
      [params.sortBy || 'checkInTime']: params.sortOrder || 'desc',
    };

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              avatar: true,
              employeeId: true,
              department: { select: { name: true } },
              designation: { select: { name: true } },
            },
          },
        },
        skip: params.skip,
        take: params.take,
        orderBy,
      }),
      prisma.attendance.count({ where }),
    ]);

    return { records, total };
  }

  async create(data: Prisma.AttendanceUncheckedCreateInput) {
    return prisma.attendance.create({ data });
  }

  async update(id: string, companyId: string, data: Prisma.AttendanceUncheckedUpdateInput) {
    return prisma.attendance.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async getTodayAttendance(companyId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.attendance.findMany({
      where: {
        companyId,
        checkInTime: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            employeeId: true,
            isOnline: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
      orderBy: { checkInTime: 'desc' },
    });
  }

  async getCheckedInEmployees(companyId: string) {
    return prisma.attendance.findMany({
      where: { companyId, status: 'CHECKED_IN' },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            avatar: true,
            employeeId: true,
            isOnline: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
      },
    });
  }

  async getWorkingHoursStats(companyId: string, startDate: Date, endDate: Date) {
    const records = await prisma.attendance.findMany({
      where: {
        companyId,
        checkInTime: { gte: startDate, lte: endDate },
        checkOutTime: { not: null },
      },
      select: { totalWorkingTime: true },
    });

    const total = records.reduce((sum, r) => sum + r.totalWorkingTime, 0);
    return records.length > 0 ? total / records.length : 0;
  }

  async getTotalDistance(companyId: string, startDate: Date, endDate: Date) {
    const result = await prisma.attendance.aggregate({
      where: {
        companyId,
        checkInTime: { gte: startDate, lte: endDate },
      },
      _sum: { totalDistance: true },
    });
    return result._sum.totalDistance || 0;
  }

  async getAttendanceTrend(companyId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await prisma.attendance.findMany({
      where: {
        companyId,
        checkInTime: { gte: startDate },
      },
      select: { checkInTime: true },
    });

    const trend: Record<string, number> = {};
    records.forEach((r) => {
      const date = r.checkInTime.toISOString().split('T')[0];
      trend[date] = (trend[date] || 0) + 1;
    });

    return trend;
  }
}

export const attendanceRepository = new AttendanceRepository();
