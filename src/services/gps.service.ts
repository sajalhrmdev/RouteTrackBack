import { gpsRepository } from '../repositories/gps.repository';
import { attendanceRepository } from '../repositories/attendance.repository';
import { employeeRepository } from '../repositories/employee.repository';
import { liveLocationRepository } from '../repositories/live-location.repository';
import { GpsLocationInput } from '../validations/attendance';
import { calculateDistance } from '../utils/helpers';
import { getIO } from '../socket';
import { AppError } from '../utils/errors';

const lastGpsUpdate = new Map<string, number>();

export class GpsService {
  async recordLocation(employeeId: string, companyId: string, data: GpsLocationInput) {
    const activeAttendance = await attendanceRepository.findActiveAttendance(employeeId, companyId);
    if (!activeAttendance) {
      throw new AppError('No active attendance session', 400);
    }

    const lastLocation = await gpsRepository.getLastLocation(employeeId, companyId);

    let newDistance = 0;
    let shouldSave = true;
    if (lastLocation) {
      newDistance = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        data.latitude,
        data.longitude
      );
      if (newDistance < 5) shouldSave = false;
    }

    let location;
    if (shouldSave) {
      location = await gpsRepository.create({
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
    } else {
      location = lastLocation || {
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      };
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

    const nowMs = Date.now();
    if (!lastGpsUpdate.get(employeeId) || nowMs - lastGpsUpdate.get(employeeId)! > 30000) {
      lastGpsUpdate.set(employeeId, nowMs);
      await employeeRepository.update(employeeId, companyId, { lastLocationAt: new Date() });
    }

    return location;
  }

  async recordBatch(employeeId: string, companyId: string, locations: GpsLocationInput[], attendanceId?: string) {
    const activeAttendance = attendanceId
      ? await attendanceRepository.findById(attendanceId, companyId)
      : await attendanceRepository.findActiveAttendance(employeeId, companyId);

    if (!activeAttendance) {
      throw new AppError('No active attendance session for batch GPS', 400);
    }

    const allData = locations.map((loc) => ({
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

    const filtered = allData.filter((loc, i) => {
      if (i === 0) return true;
      const prev = allData[i - 1];
      const dist = calculateDistance(prev.latitude, prev.longitude, loc.latitude, loc.longitude);
      return dist >= 5;
    });

    if (filtered.length > 0) {
      await gpsRepository.createMany(filtered);
    }

    const lastLoc = allData[allData.length - 1];
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

      const nowMs = Date.now();
      if (!lastGpsUpdate.get(employeeId) || nowMs - lastGpsUpdate.get(employeeId)! > 30000) {
        lastGpsUpdate.set(employeeId, nowMs);
        await employeeRepository.update(employeeId, companyId, { lastLocationAt: new Date() });
      }
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

    const stops: Array<{
      latitude: number;
      longitude: number;
      arrivedAt: Date;
      departedAt: Date;
      duration: number;
    }> = [];

    if (locations.length > 1) {
      let cluster: typeof locations = [];
      const addStop = (pts: typeof locations) => {
        if (pts.length < 2) return;
        const secs = Math.floor((pts[pts.length - 1].timestamp.getTime() - pts[0].timestamp.getTime()) / 1000);
        if (secs < 300) return;
        const lat = pts.reduce((s, p) => s + p.latitude, 0) / pts.length;
        const lng = pts.reduce((s, p) => s + p.longitude, 0) / pts.length;
        stops.push({
          latitude: lat,
          longitude: lng,
          arrivedAt: pts[0].timestamp,
          departedAt: pts[pts.length - 1].timestamp,
          duration: secs,
        });
      };

      cluster = [locations[0]];
      for (let i = 1; i < locations.length; i++) {
        const dist = calculateDistance(
          cluster[cluster.length - 1].latitude,
          cluster[cluster.length - 1].longitude,
          locations[i].latitude,
          locations[i].longitude
        );
        if (dist < 10) {
          cluster.push(locations[i]);
        } else {
          addStop(cluster);
          cluster = [locations[i]];
        }
      }
      addStop(cluster);
    }

    return {
      locations,
      stops: stops.map((s) => ({
        latitude: s.latitude,
        longitude: s.longitude,
        arrivedAt: s.arrivedAt.toISOString(),
        departedAt: s.departedAt.toISOString(),
        duration: s.duration,
      })),
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
