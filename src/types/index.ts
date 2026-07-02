import { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthPayload {
  userId: string;
  companyId: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface GpsData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  timestamp: string;
}

export interface AttendanceWithEmployee {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  department?: string;
  designation?: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  totalDistance: number;
  totalWorkingTime: number;
  lastLocation?: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    batteryLevel?: number;
    timestamp: string;
  };
  isOnline: boolean;
}

export interface DashboardStats {
  totalEmployees: number;
  employeesOnline: number;
  employeesOffline: number;
  todayAttendance: number;
  totalDistance: number;
  averageWorkingHours: number;
  activeRoutes: number;
}

export interface SocketEvents {
  locationUpdate: (data: {
    employeeId: string;
    companyId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    batteryLevel?: number;
    timestamp: string;
  }) => void;

  employeeStatus: (data: {
    employeeId: string;
    companyId: string;
    isOnline: boolean;
    attendanceStatus?: string;
  }) => void;

  notification: (data: {
    title: string;
    message: string;
    type: string;
    userId: string;
  }) => void;

  attendanceUpdate: (data: {
    employeeId: string;
    companyId: string;
    status: string;
    timestamp: string;
  }) => void;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
    companyId: string;
    company?: { name: string; logo?: string | null };
  };
  tokens: JwtTokens;
}
