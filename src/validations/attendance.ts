import { z } from 'zod';

export const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  address: z.string().optional(),
});

export const checkOutSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  address: z.string().optional(),
});

export const gpsLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  timestamp: z.string().datetime().optional(),
  employeeId: z.string().optional(),
});

export const gpsBatchSchema = z.object({
  locations: z.array(gpsLocationSchema).min(1).max(100),
  attendanceId: z.string().uuid().optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type GpsLocationInput = z.infer<typeof gpsLocationSchema>;
export type GpsBatchInput = z.infer<typeof gpsBatchSchema>;
