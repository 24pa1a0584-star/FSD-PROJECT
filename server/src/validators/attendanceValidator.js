const { z } = require('zod');

const manualCheckInSchema = z.object({
  rollNumber: z.string().min(3, 'Roll number is required').trim().transform((v) => v.toUpperCase()),
  gymId: z.string().min(1, 'Target gym facility ID is required'),
  notes: z.string().optional(),
});

const manualCheckOutSchema = z.object({
  rollNumber: z.string().trim().transform((v) => v.toUpperCase()).optional(),
  attendanceId: z.string().optional(),
  gymId: z.string().min(1, 'Gym ID is required'),
  notes: z.string().optional(),
}).refine(data => data.rollNumber || data.attendanceId, {
  message: 'Either student roll number or active attendance ID must be provided',
});

const qrScanSchema = z.object({
  qrToken: z.string().min(10, 'Valid QR token string is required'),
  gymId: z.string().min(1, 'Gym facility ID is required'),
});

module.exports = {
  manualCheckInSchema,
  manualCheckOutSchema,
  qrScanSchema,
};
