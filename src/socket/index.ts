import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthPayload } from '../types';
import { logger } from '../config/logger';
import { employeeRepository } from '../repositories/employee.repository';
import { attendanceRepository } from '../repositories/attendance.repository';
import { gpsRepository } from '../repositories/gps.repository';
import { liveLocationRepository } from '../repositories/live-location.repository';
import { resolveEmployeeId, calculateDistance } from '../utils/helpers';

let io: Server;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token as string, config.jwt.accessSecret) as AuthPayload;
      (socket as any).user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;
    logger.info(`Socket connected: ${user.userId} (${user.role})`);

    socket.join(`user:${user.userId}`);
    socket.join(`company:${user.companyId}`);

    const empId = await resolveEmployeeId(user.userId, user.companyId);
    (socket as any).empId = empId;

    if (empId) {
      await employeeRepository.update(empId, user.companyId, { isOnline: true });

      io.to(`company:${user.companyId}`).emit('employeeStatus', {
        employeeId: empId,
        companyId: user.companyId,
        isOnline: true,
      });
    }

    socket.on('joinAttendance', (attendanceId: string) => {
      socket.join(`attendance:${attendanceId}`);
    });

    socket.on('leaveAttendance', (attendanceId: string) => {
      socket.leave(`attendance:${attendanceId}`);
    });

    socket.on('locationUpdate', async (data: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
      batteryLevel?: number;
    }) => {
      try {
        const empId = (socket as any).empId;
        if (!empId) return;

        const activeAttendance = await attendanceRepository.findActiveAttendance(
          empId,
          user.companyId
        );

        if (activeAttendance) {
          const lastLocation = await gpsRepository.getLastLocation(empId, user.companyId);

          let newDistance = 0;
          if (lastLocation) {
            newDistance = calculateDistance(
              lastLocation.latitude,
              lastLocation.longitude,
              data.latitude,
              data.longitude
            );
          }

          await gpsRepository.create({
            employeeId: empId,
            companyId: user.companyId,
            attendanceId: activeAttendance.id,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            speed: data.speed,
            heading: data.heading,
            batteryLevel: data.batteryLevel,
            timestamp: new Date(),
          });

          if (newDistance > 0) {
            await attendanceRepository.update(activeAttendance.id, user.companyId, {
              totalDistance: { increment: newDistance },
            });
          }

          await liveLocationRepository.upsert(
            empId,
            user.companyId,
            activeAttendance.id,
            {
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: data.accuracy,
              speed: data.speed,
              heading: data.heading,
              batteryLevel: data.batteryLevel,
              timestamp: new Date(),
            }
          );

          io.to(`company:${user.companyId}`).emit('locationUpdate', {
            employeeId: empId,
            companyId: user.companyId,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy,
            speed: data.speed,
            heading: data.heading,
            batteryLevel: data.batteryLevel,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        logger.error('Socket location update error:', error);
      }
    });

    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${user.userId}`);
      const empId = (socket as any).empId;
      if (empId) {
        await employeeRepository.update(empId, user.companyId, { isOnline: false });

        io.to(`company:${user.companyId}`).emit('employeeStatus', {
          employeeId: empId,
          companyId: user.companyId,
          isOnline: false,
        });
      }
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
