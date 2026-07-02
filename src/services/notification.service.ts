import { notificationRepository } from '../repositories/notification.repository';
import { getIO } from '../socket';
import { getPaginationParams } from '../utils/helpers';

export class NotificationService {
  async create(companyId: string, userId: string, title: string, message: string, type: string = 'INFO', data?: any) {
    const notification = await notificationRepository.create({
      companyId,
      userId,
      title,
      message,
      type,
      data: data || undefined,
    });

    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification', {
        id: notification.id,
        title,
        message,
        type,
        data,
        createdAt: notification.createdAt,
      });
    } catch {
      // Socket not available
    }

    return notification;
  }

  async getAll(companyId: string, userId: string, query: any) {
    const { page, limit, skip } = getPaginationParams(query);
    const unreadOnly = query.unreadOnly === 'true';

    const { notifications, total, unreadCount } = await notificationRepository.findAll(
      companyId,
      userId,
      { skip, take: limit, unreadOnly }
    );

    return {
      data: notifications,
      unreadCount,
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

  async markAsRead(id: string, userId: string) {
    await notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string, companyId: string) {
    await notificationRepository.markAllAsRead(userId, companyId);
  }

  async delete(id: string, userId: string) {
    await notificationRepository.delete(id, userId);
  }

  async sendAttendanceNotification(companyId: string, userIds: string[], employeeName: string, action: 'check_in' | 'check_out') {
    const title = action === 'check_in' ? 'Employee Check In' : 'Employee Check Out';
    const message = `${employeeName} has ${action === 'check_in' ? 'checked in' : 'checked out'}`;

    for (const userId of userIds) {
      await this.create(companyId, userId, title, message, 'ATTENDANCE');
    }
  }

  async sendLowBatteryAlert(companyId: string, userIds: string[], employeeName: string, batteryLevel: number) {
    await Promise.all(
      userIds.map((userId) =>
        this.create(
          companyId,
          userId,
          'Low Battery',
          `${employeeName}'s battery is low (${batteryLevel}%)`,
          'WARNING'
        )
      )
    );
  }

  async sendGpsDisabledAlert(companyId: string, userIds: string[], employeeName: string) {
    await Promise.all(
      userIds.map((userId) =>
        this.create(
          companyId,
          userId,
          'GPS Disabled',
          `${employeeName}'s GPS has been disabled`,
          'WARNING'
        )
      )
    );
  }
}

export const notificationService = new NotificationService();
