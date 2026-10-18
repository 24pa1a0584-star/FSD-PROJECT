const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address').trim().transform((v) => v.toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Valid institutional email is required').trim().transform((v) => v.toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rollNumber: z
    .string()
    .min(5, 'Roll number is required')
    .max(12, 'Roll number is too long')
    .trim()
    .transform((v) => v.toUpperCase()),
  department: z.enum(['CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL', 'AI&DS', 'CSBS']),
  academicYear: z.coerce.number().int().min(1).max(4),
  section: z.string().max(2).default('A').transform((v) => v.toUpperCase()),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits').trim(),
  studentType: z.enum(['Hosteller', 'Day Scholar']).default('Hosteller'),
  assignedGym: z.string().min(1, 'Target gym facility must be selected'),
  emergencyContact: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relation: z.string().optional(),
    })
    .optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().or(z.literal('')).optional(),
});

module.exports = {
  loginSchema,
  registerStudentSchema,
  changePasswordSchema,
  updateProfileSchema,
};
