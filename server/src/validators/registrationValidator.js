const { z } = require('zod');

const submitRegistrationSchema = z.object({
  gymId: z.string().min(1, 'Target gym facility ID is required'),
  preferredSlot: z
    .enum(['MORNING (6 AM - 8 AM)', 'EVENING (4 PM - 6 PM)', 'NIGHT (6 PM - 8 PM)', 'FLEXIBLE'])
    .default('MORNING (6 AM - 8 AM)'),
  fitnessGoals: z.string().min(3).default('General Fitness'),
  medicalClearance: z.boolean().default(true),
});

const reviewRegistrationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
  durationMonths: z.coerce.number().int().min(1).max(12).default(6),
});

module.exports = {
  submitRegistrationSchema,
  reviewRegistrationSchema,
};
