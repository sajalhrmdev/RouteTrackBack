import { attendanceRepository } from '../repositories/attendance.repository';
import { gpsRepository } from '../repositories/gps.repository';
import { employeeRepository } from '../repositories/employee.repository';
import { AppError, NotFoundError } from '../utils/errors';
import { getPaginationParams } from '../utils/helpers';
import { CheckInInput, CheckOutInput } from '../validations/attendance';
import { v4 as uuidv4 } from 'uuid';

export class AttendanceService {
  async checkIn(employeeId: string, companyId: string, data: CheckInInput) {
    const activeAttendance = await attendanceRepository.findActiveAttendance(employeeId, companyId);
    if (activeAttendance) {
      throw new AppError('Already checked in. Please check out first.', 400);
    }

    const attendance = await attendanceRepository.create({
      employeeId,
      companyId,
      checkInTime: new Date(),
      checkInLat: data.latitude,
      checkInLng: data.longitude,
      checkInAddress: data.address,
      status: 'CHECKED_IN',
    });

    await employeeRepository.update(employeeId, companyId, { isOnline: true });

    await gpsRepository.create({
      employeeId,
      companyId,
      attendanceId: attendance.id,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      timestamp: new Date(),
    });

    return attendance;
  }

  async checkOut(employeeId: string, companyId: string, data: CheckOutInput) {
    const activeAttendance = await attendanceRepository.findActiveAttendance(employeeId, companyId);
    if (!activeAttendance) {
      throw new AppError('No active attendance session found', 400);
    }

    const workingTime = Math.floor((Date.now() - activeAttendance.checkInTime.getTime()) / 1000);

    await employeeRepository.update(employeeId, companyId, { isOnline: false });

    await attendanceRepository.update(activeAttendance.id, companyId, {
      checkOutTime: new Date(),
      checkOutLat: data.latitude,
      checkOutLng: data.longitude,
      checkOutAddress: data.address,
      totalWorkingTime: activeAttendance.totalWorkingTime + workingTime,
      status: 'CHECKED_OUT',
    });

    await gpsRepository.create({
      employeeId,
      companyId,
      attendanceId: activeAttendance.id,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      timestamp: new Date(),
    });

    return attendanceRepository.findById(activeAttendance.id, companyId);
  }

  async getTodayAttendance(companyId: string) {
    return attendanceRepository.getTodayAttendance(companyId);
  }

  async getCheckedInEmployees(companyId: string) {
    const records = await attendanceRepository.getCheckedInEmployees(companyId);

    const employeesWithLocation = await Promise.all(
      records.map(async (record) => {
        const lastLocation = await gpsRepository.getLastLocation(record.employeeId, companyId);
        return {
          id: record.id,
          employeeId: record.employeeId,
          employeeName: record.employee.name,
          employeeAvatar: record.employee.avatar,
          employee: record.employee,
          department: record.employee.department?.name,
          designation: record.employee.designation?.name,
          checkInTime: record.checkInTime,
          status: record.status,
          totalDistance: record.totalDistance,
          totalWorkingTime: record.totalWorkingTime,
          lastLocation: lastLocation ? {
            latitude: lastLocation.latitude,
            longitude: lastLocation.longitude,
            speed: lastLocation.speed,
            heading: lastLocation.heading,
            batteryLevel: lastLocation.batteryLevel,
            timestamp: lastLocation.timestamp,
          } : null,
          isOnline: record.employee.isOnline,
        };
      })
    );

    return employeesWithLocation;
  }

  async getHistory(companyId: string, query: any) {
    const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(query);
    const { records, total } = await attendanceRepository.findAll(companyId, {
      skip,
      take: limit,
      sortBy,
      sortOrder,
      employeeId: query.employeeId,
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    return {
      data: records,
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

  async getEmployeeToday(employeeId: string, companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { records } = await attendanceRepository.findAll(companyId, {
      employeeId,
      startDate: today,
    });

    return records[0] || null;
  }

  async getStats(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayAttendance, checkedIn, avgHours, totalDistance, trend] = await Promise.all([
      attendanceRepository.getTodayAttendance(companyId),
      attendanceRepository.getCheckedInEmployees(companyId),
      attendanceRepository.getWorkingHoursStats(companyId, today, new Date()),
      attendanceRepository.getTotalDistance(companyId, today, new Date()),
      attendanceRepository.getAttendanceTrend(companyId, 30),
    ]);

    return {
      todayCount: todayAttendance.length,
      checkedInCount: checkedIn.length,
      averageWorkingHours: Math.round(avgHours / 3600 * 100) / 100,
      totalDistance: Math.round(totalDistance),
      trend,
    };
  }
}

export const attendanceService = new AttendanceService();
