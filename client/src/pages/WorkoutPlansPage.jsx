import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Common/Badge';
import Modal from '../components/Common/Modal';
import { Dumbbell, Plus, Calendar, Clock, Flame, Check } from 'lucide-react';
import { toast } from 'sonner';

const WorkoutPlansPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { user, isSuperAdmin, isGymManager, isTrainer } = useAuth();
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['workoutPlans'],
    queryFn: async () => {
      const res = await api.get('/workouts');
      return res.data.plans;
    },
  });

  const { data: students } = useQuery({
    queryKey: ['studentsCompact'],
    queryFn: async () => {
      const res = await api.get('/students?limit=100');
      return res.data.students;
    },
    enabled: isCreateOpen,
  });

  const [newPlan, setNewPlan] = useState({
    title: '',
    studentId: '',
    gymId: '',
    level: 'BEGINNER',
    description: '',
    weeklySchedule: [
      {
        day: 'Monday',
        focusArea: 'Upper Body & Core',
        isRestDay: false,
        exercises: [
          { name: 'Pushups', sets: 3, reps: '12-15', restSeconds: 60, instructions: 'Keep core tight' },
          { name: 'Dumbbell Rows', sets: 3, reps: '10', restSeconds: 60, instructions: 'Squeeze back' },
        ],
      },
      {
        day: 'Wednesday',
        focusArea: 'Lower Body Strength',
        isRestDay: false,
        exercises: [
          { name: 'Goblet Squats', sets: 3, reps: '12', restSeconds: 60, instructions: 'Full depth' },
          { name: 'Glute Bridges', sets: 3, reps: '15', restSeconds: 45, instructions: 'Hold at top' },
        ],
      },
      {
        day: 'Friday',
        focusArea: 'Full Body Conditioning',
        isRestDay: false,
        exercises: [
          { name: 'Treadmill Interval Run', durationMin: 15, restSeconds: 60, instructions: 'Jog and sprint' },
        ],
      },
    ],
  });

  const createPlanMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/workouts', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Workout plan created and assigned to student!');
      queryClient.invalidateQueries({ queryKey: ['workoutPlans'] });
      setIsCreateOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create plan.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Campus Workout Plans & Training Schedules
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Structured fitness programming with daily exercises, sets, reps, and instructions
          </p>
        </div>

        {(isSuperAdmin || isGymManager || isTrainer) && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workout Plan</span>
          </button>
        )}
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(plans || []).map((p) => (
          <div
            key={p._id}
            className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-md transition"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant={p.level}>{p.level}</Badge>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">
                    {p.title}
                  </h3>
                </div>
                <Badge variant={p.gymId?.code}>{p.gymId?.name}</Badge>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="text-slate-400 block mb-0.5">Assigned Student:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {p.studentId?.userId?.name} ({p.studentId?.rollNumber})
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Coach: {p.trainerId?.userId?.name || 'Assigned Instructor'}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-3 line-clamp-2">{p.description}</p>

              {/* Days preview */}
              <div className="mt-4 flex flex-wrap gap-1">
                {(p.weeklySchedule || []).map((day) => (
                  <span
                    key={day.day}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      day.isRestDay
                        ? 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                        : 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                    }`}
                  >
                    {day.day.substring(0, 3)}: {day.focusArea}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedPlan(p)}
              className="mt-6 w-full py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition text-center"
            >
              View Full Weekly Schedule
            </button>
          </div>
        ))}
      </div>

      {/* Plan Details Modal */}
      <Modal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        title={selectedPlan?.title || 'Weekly Workout Schedule'}
        maxWidth="max-w-2xl"
      >
        {selectedPlan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block">Trainee</span>
                <strong className="text-slate-900 dark:text-white">
                  {selectedPlan.studentId?.userId?.name} ({selectedPlan.studentId?.rollNumber})
                </strong>
              </div>
              <Badge variant={selectedPlan.level}>{selectedPlan.level}</Badge>
            </div>

            <div className="space-y-3">
              {(selectedPlan.weeklySchedule || []).map((day) => (
                <div
                  key={day.day}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {day.day}
                    </span>
                    <span className="font-semibold text-brand-600 dark:text-brand-400">
                      {day.focusArea}
                    </span>
                  </div>

                  {day.isRestDay ? (
                    <p className="text-slate-400 italic">Active Rest / Recovery Day</p>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {(day.exercises || []).map((ex, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              {ex.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {ex.instructions}
                            </span>
                          </div>
                          <div className="text-right font-mono text-[11px]">
                            {ex.sets && (
                              <span className="font-bold text-brand-600 dark:text-brand-400 block">
                                {ex.sets} sets × {ex.reps}
                              </span>
                            )}
                            {ex.durationMin > 0 && (
                              <span className="text-slate-400">{ex.durationMin} mins</span>
                            )}
                            <span className="text-slate-400 text-[10px]">
                              Rest: {ex.restSeconds}s
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Plan Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Assign New Workout Schedule"
        maxWidth="max-w-xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newPlan.title || !newPlan.studentId || !newPlan.gymId) {
              return toast.error('Please complete title, student, and facility');
            }
            createPlanMutation.mutate(newPlan);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
              Plan Title
            </label>
            <input
              type="text"
              required
              value={newPlan.title}
              onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              placeholder="e.g. Strength Progression Split"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                Select Student
              </label>
              <select
                required
                value={newPlan.studentId}
                onChange={(e) => {
                  const s = students?.find((item) => item._id === e.target.value);
                  setNewPlan({
                    ...newPlan,
                    studentId: e.target.value,
                    gymId: s?.assignedGym?._id || '',
                  });
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">Select Student...</option>
                {students?.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.userId?.name} ({s.rollNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                Experience Level
              </label>
              <select
                value={newPlan.level}
                onChange={(e) => setNewPlan({ ...newPlan, level: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
              Description & Objectives
            </label>
            <textarea
              rows={2}
              value={newPlan.description}
              onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              placeholder="Student guidance instructions..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPlanMutation.isPending}
              className="px-4 py-2 font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition"
            >
              {createPlanMutation.isPending ? 'Assigning...' : 'Assign Plan to Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkoutPlansPage;
