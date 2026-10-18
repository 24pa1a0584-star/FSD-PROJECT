const { z } = require('zod');

const createEquipmentSchema = z.object({
  name: z.string().min(2, 'Equipment name is required').trim(),
  code: z.string().min(2, 'Equipment code is required').trim().transform((v) => v.toUpperCase()),
  gymId: z.string().min(1, 'Gym ID is required'),
  category: z.enum(['CARDIO', 'STRENGTH', 'FREE_WEIGHTS', 'ACCESSORIES']),
  quantity: z.coerce.number().int().min(1).default(1),
  availableQuantity: z.coerce.number().int().min(0).default(1),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).default('GOOD'),
  status: z.enum(['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE']).default('AVAILABLE'),
  lastMaintenanceDate: z.string().optional(),
  nextMaintenanceDate: z.string().optional(),
  notes: z.string().optional(),
});

const reportMaintenanceSchema = z.object({
  issueDescription: z.string().min(5, 'Issue description must be at least 5 characters').trim(),
  status: z.enum(['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'DECOMMISSIONED']).default('REPORTED'),
  serviceVendor: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  resolutionNotes: z.string().optional(),
});

module.exports = {
  createEquipmentSchema,
  reportMaintenanceSchema,
};
