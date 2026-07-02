import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class GpsRepository {
  async create(data: Prisma.GpsLocationUncheckedCreateInput) {
    return prisma.gpsLocation.create({ data });
  }

  async createMany(data: Prisma.GpsLocationUncheckedCreateInput[]) {
    return prisma.gpsLocation.createMany({ data });
  }

  async findByEmployeeAndDate(employeeId: string, companyId: string, startDate: Date, endDate: Date) {
    return prisma.gpsLocation.findMany({
      where: {
        employeeId,
        companyId,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getLastLocation(employeeId: string, companyId: string) {
    return prisma.gpsLocation.findFirst({
      where: { employeeId, companyId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getRouteHistory(employeeId: string, date: Date, companyId: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.gpsLocation.findMany({
      where: {
        employeeId,
        companyId,
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async deleteOldRecords(retentionDays: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    return prisma.gpsLocation.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });
  }
}

export const gpsRepository = new GpsRepository();
