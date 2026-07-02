import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class CompanyRepository {
  async findById(id: string) {
    return prisma.company.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.company.findUnique({ where: { email } });
  }

  async create(data: Prisma.CompanyCreateInput) {
    return prisma.company.create({ data });
  }

  async update(id: string, data: Prisma.CompanyUpdateInput) {
    return prisma.company.update({ where: { id }, data });
  }

  async getDashboardStats(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEmployees, onlineCount, todayAttendance, totalDistanceResult, avgHoursResult] = await Promise.all([
      prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { companyId, isOnline: true } }),
      prisma.attendance.count({
        where: {
          companyId,
          checkInTime: { gte: today },
        },
      }),
      prisma.attendance.aggregate({
        where: {
          companyId,
          checkInTime: { gte: today },
        },
        _sum: { totalDistance: true },
      }),
      prisma.attendance.aggregate({
        where: {
          companyId,
          checkInTime: { gte: today },
          checkOutTime: { not: null },
        },
        _avg: { totalWorkingTime: true },
      }),
    ]);

    const activeRoutes = await prisma.attendance.count({
      where: { companyId, status: 'CHECKED_IN' },
    });

    return {
      totalEmployees,
      employeesOnline: onlineCount,
      employeesOffline: totalEmployees - onlineCount,
      todayAttendance,
      totalDistance: totalDistanceResult._sum.totalDistance || 0,
      averageWorkingHours: Math.round((avgHoursResult._avg.totalWorkingTime || 0) / 3600 * 100) / 100,
      activeRoutes,
    };
  }
}

export const companyRepository = new CompanyRepository();
