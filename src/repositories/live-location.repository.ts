import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class LiveLocationRepository {
  async upsert(
    employeeId: string,
    companyId: string,
    attendanceId: string,
    data: {
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      speed?: number | null;
      heading?: number | null;
      batteryLevel?: number | null;
      timestamp: Date;
    }
  ) {
    return prisma.liveLocation.upsert({
      where: { employeeId },
      create: {
        employeeId,
        companyId,
        attendanceId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        batteryLevel: data.batteryLevel,
        timestamp: data.timestamp,
      },
      update: {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        batteryLevel: data.batteryLevel,
        timestamp: data.timestamp,
      },
    });
  }

  async findByCompany(companyId: string) {
    return prisma.liveLocation.findMany({
      where: { companyId },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            isOnline: true,
            lastLocationAt: true,
          },
        },
        attendance: {
          select: {
            id: true,
            checkInTime: true,
            totalDistance: true,
            totalWorkingTime: true,
          },
        },
      },
    });
  }

  async deleteByEmployeeId(employeeId: string, companyId: string) {
    return prisma.liveLocation.deleteMany({
      where: { employeeId, companyId },
    });
  }
}

export const liveLocationRepository = new LiveLocationRepository();
