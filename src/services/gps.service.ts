import { gpsRepository } from '../repositories/gps.repository';
import { attendanceRepository } from '../repositories/attendance.repository';
import { liveLocationRepository } from '../repositories/live-location.repository';
import { GpsLocationInput } from '../validations/attendance';
import { calculateDistance } from '../utils/helpers';
import { getIO } from '../socket';
import { AppError } from '../utils/errors';

export class GpsService {
  async recordLocation(employeeId: string, companyId: string, data: GpsLocationInput) {
    const activeAttendance = await attendanceRepository.findActiveAttendance(employeeId, companyId);
    if (!activeAttendance) {
      throw new AppError('No active attendance session', 400);
    }

    const lastLocation = await gpsRepository.getLastLocation(employeeId, companyId);

    let newDistance = 0;
    if (lastLocation) {
      newDistance = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        data.latitude,
        data.longitude
      );
    }

    const location = await gpsRepository.create({
      employeeId,
      companyId,
      attendanceId: activeAttendance.id,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      speed: data.speed,
      heading: data.heading,
      batteryLevel: data.batteryLevel,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    });

    if (newDistance > 0) {
      await attendanceRepository.update(activeAttendance.id, companyId, {
        totalDistance: { increment: newDistance },
      });
    }

    try {
      const io = getIO();
      io.to(`company:${companyId}`).emit('locationUpdate', {
        employeeId,
        companyId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        batteryLevel: data.batteryLevel,
        timestamp: location.timestamp,
      });
    } catch {
      // Socket not available
    }

    await liveLocationRepository.upsert(
      employeeId,
      companyId,
      activeAttendance.id,
      {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        batteryLevel: data.batteryLevel,
        timestamp: location.timestamp,
      }
    );

    return location;
  }

  async recordBatch(employeeId: string, companyId: string, locations: GpsLocationInput[], attendanceId?: string) {
    const activeAttendance = attendanceId
      ? await attendanceRepository.findById(attendanceId, companyId)
      : await attendanceRepository.findActiveAttendance(employeeId, companyId);

    if (!activeAttendance) {
      throw new AppError('No active attendance session for batch GPS', 400);
    }

    const data = locations.map((loc) => ({
      employeeId,
      companyId,
      attendanceId: activeAttendance.id,
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy,
      speed: loc.speed,
      heading: loc.heading,
      batteryLevel: loc.batteryLevel,
      timestamp: loc.timestamp ? new Date(loc.timestamp) : new Date(),
    }));

    await gpsRepository.createMany(data);

    const lastLoc = data[data.length - 1];
    if (lastLoc) {
      await liveLocationRepository.upsert(
        employeeId,
        companyId,
        activeAttendance.id,
        {
          latitude: lastLoc.latitude,
          longitude: lastLoc.longitude,
          accuracy: lastLoc.accuracy,
          speed: lastLoc.speed,
          heading: lastLoc.heading,
          batteryLevel: lastLoc.batteryLevel,
          timestamp: lastLoc.timestamp,
        }
      );
    }
  }

  async getRouteHistory(employeeId: string, date: string, companyId: string) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new AppError('Invalid date', 400);
    }

    const locations = await gpsRepository.getRouteHistory(employeeId, parsedDate, companyId);

    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      totalDistance += calculateDistance(
        locations[i - 1].latitude,
        locations[i - 1].longitude,
        locations[i].latitude,
        locations[i].longitude
      );
    }

    const totalTime = locations.length > 0
      ? Math.floor((locations[locations.length - 1].timestamp.getTime() - locations[0].timestamp.getTime()) / 1000)
      : 0;

    return {
      locations,
      totalDistance: Math.round(totalDistance),
      totalTime,
      startTime: locations[0]?.timestamp,
      endTime: locations[locations.length - 1]?.timestamp,
      startLocation: locations[0] ? { lat: locations[0].latitude, lng: locations[0].longitude } : null,
      endLocation: locations[locations.length - 1] ? { lat: locations[locations.length - 1].latitude, lng: locations[locations.length - 1].longitude } : null,
    };
  }
}

export const gpsService = new GpsService();
