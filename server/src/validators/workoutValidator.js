const { z } = require('zod');

const exerciseItemSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  targetMuscle: z.string().default('General'),
  sets: z.coerce.number().int().min(1).default(3),
  reps: z.string().default('10-12'),
  durationMin: z.coerce.number().min(0).default(0),
  restSeconds: z.coerce.number().min(0).default(60),
  instructions: z.string().default(''),
});

const dayScheduleSchema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  focusArea: z.string().default('Full Body'),
  isRestDay: z.boolean().default(false),
  exercises: z.array(exerciseItemSchema).default([]),
});

const workoutPlanSchema = z.object({
  title: z.string().min(2, 'Plan title is required').trim(),
  studentId: z.string().min(1, 'Target student ID is required'),
  gymId: z.string().min(1, 'Gym ID is required'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  description: z.string().optional(),
  weeklySchedule: z.array(dayScheduleSchema).min(1, 'At least one day schedule is required'),
  healthMetrics: z
    .object({
      heightCm: z.coerce.number().optional(),
      weightKg: z.coerce.number().optional(),
      bmi: z.coerce.number().optional(),
      targetGoal: z.string().optional(),
    })
    .optional(),
});

module.exports = {
  workoutPlanSchema,
};
