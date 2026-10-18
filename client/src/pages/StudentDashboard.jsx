import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Badge from '../components/Common/Badge';
import {
  CreditCard,
  QrCode,
  Dumbbell,
  Clock,
  Award,
  Bell,
  ArrowRight,
  Flame,
  CheckCircle,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, studentProfile } = useAuth();

  const { data: cardData } = useQuery({
    queryKey: ['myCard'],
    queryFn: async () => {
      const res = await api.get('/memberships/my-card');
      return res.data.card;
    },
  });

  const { data: workoutPlan } = useQuery({
    queryKey: ['myWorkoutPlan'],
    queryFn: async () => {
      const res = await api.get('/workouts/my-plan');
      return res.data.plan;
    },
  });

  const { data: attendanceHistory } = useQuery({
    queryKey: ['myAttendance'],
    queryFn: async () => {
      const res = await api.get('/attendance/my-history');
      return res.data.history;
    },
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await api.get('/announcements');
      return res.data.announcements;
    },
  });

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden bg-gradient-to-r from-slate-900 to-navy-900 text-white">
        <div className="relative z-10">
          <span className="text-xs font-bold tracking-widest text-brand-400 uppercase">
            Student Fitness Portal • VITB
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Roll No: <strong>{studentProfile?.rollNumber}</strong> • {studentProfile?.department} (Year {studentProfile?.academicYear}) • {cardData?.gymName || 'Campus Gym'}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            to="/card"
            className="px-5 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-brand-500/30 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Open Digital Pass</span>
          </Link>
        </div>
      </div>

      {/* Grid: Pass Overview & Trainer Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pass Status Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Membership Pass
              </span>
              <Badge variant={cardData?.hasActiveMembership ? 'ACTIVE' : 'EXPIRED'}>
                {cardData?.hasActiveMembership ? 'VALID' : 'PENDING'}
              </Badge>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {cardData?.membership?.membershipTypeId?.name || 'Semester Fitness Pass'}
            </h3>
            <p className="font-mono text-xs text-brand-600 dark:text-brand-400 mt-0.5">
              ID: {cardData?.qrCardId || 'Awaiting issuance'}
            </p>

            <div className="mt-4 text-xs text-slate-500 space-y-1">
              <p>
                Facility: <strong>{cardData?.gymName}</strong>
              </p>
              <p>
                Expiry Date:{' '}
                <strong>
                  {cardData?.membership
                    ? new Date(cardData.membership.endDate).toLocaleDateString()
                    : 'N/A'}
                </strong>
              </p>
            </div>
          </div>

          <Link
            to="/card"
            className="mt-6 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
          >
            <span>View Dynamic QR Code</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Assigned Trainer Card */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Assigned Coach
              </span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>

            {workoutPlan?.trainerId ? (
              <div className="flex items-center gap-3">
                <img
                  src={
                    workoutPlan.trainerId?.userId?.avatar ||
                    'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150'
                  }
                  alt="Coach"
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-300 dark:border-slate-700"
                />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    {workoutPlan.trainerId?.userId?.name}
                  </h4>
                  <p className="text-xs text-slate-500">Certified Strength & Fitness Mentor</p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                <p>Campus Fitness Incharge</p>
                <p className="mt-1">Visit your gym desk to request personalized trainer assignment.</p>
              </div>
            )}
          </div>

          <Link
            to="/my-workout"
            className="mt-6 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
          >
            <span>Review Workout Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Total Workout Sessions */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Workout Activity
              </span>
              <Flame className="w-5 h-5 text-rose-500" />
            </div>

            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {attendanceHistory?.length || 0}
            </span>
            <span className="text-xs text-slate-500 block mt-1">
              Recorded workouts this academic term
            </span>
          </div>

          <Link
            to="/my-attendance"
            className="mt-6 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
          >
            <span>View Attendance Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Today's Workout Routine Preview */}
      {workoutPlan && (
        <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                Assigned Program: {workoutPlan.title} ({workoutPlan.level})
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Weekly Training Routine
              </h3>
            </div>
            <Link
              to="/my-workout"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              See Full Split
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(workoutPlan.weeklySchedule || []).slice(0, 3).map((day) => (
              <div
                key={day.day}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between font-bold mb-2">
                  <span className="text-slate-900 dark:text-white">{day.day}</span>
                  <span className="text-brand-600 dark:text-brand-400">{day.focusArea}</span>
                </div>
                {day.isRestDay ? (
                  <p className="text-slate-400 italic">Rest Day</p>
                ) : (
                  <div className="space-y-1.5">
                    {(day.exercises || []).map((ex, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {ex.name}
                        </span>
                        <span className="font-mono text-slate-500">
                          {ex.sets} × {ex.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campus Announcements */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-500" />
          <span>Latest Campus Gym Notices</span>
        </h3>

        <div className="space-y-2.5">
          {(announcements || []).slice(0, 3).map((a) => (
            <div
              key={a._id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <strong className="text-slate-900 dark:text-white">{a.title}</strong>
                <span className="text-[10px] text-slate-400">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{a.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
