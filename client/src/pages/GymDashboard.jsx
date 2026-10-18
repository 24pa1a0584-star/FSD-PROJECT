import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/Common/StatCard';
import Badge from '../components/Common/Badge';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';
import {
  Users,
  CreditCard,
  ClipboardList,
  UserCheck,
  Wrench,
  Award,
  Clock,
  ArrowRight,
  QrCode,
  Flame,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const GymDashboard = ({ facilityCode }) => {
  const { user, assignedGymId, isSuperAdmin } = useAuth();

  // First fetch gyms if needed to resolve gymId
  const { data: gymsData } = useQuery({
    queryKey: ['gymsList'],
    queryFn: async () => {
      const res = await api.get('/gyms');
      return res.data.gyms;
    },
  });

  const targetGym = React.useMemo(() => {
    if (!gymsData) return null;
    if (facilityCode) {
      return gymsData.find((g) => g.code === facilityCode);
    }
    if (assignedGymId) {
      return gymsData.find((g) => g._id === assignedGymId);
    }
    return gymsData[0];
  }, [gymsData, facilityCode, assignedGymId]);

  const targetGymId = targetGym?._id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['facilityDashboard', targetGymId],
    queryFn: async () => {
      if (!targetGymId) return null;
      const res = await api.get(`/gyms/${targetGymId}/dashboard`);
      return res.data;
    },
    enabled: !!targetGymId,
    refetchInterval: 30000,
  });

  if (isLoading || !targetGym) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton count={3} height="h-28" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 glass-card rounded-2xl text-rose-500 text-center">
        Error loading facility dashboard: {error.message}
      </div>
    );
  }

  const { gym, stats, peakHours, recentActivity } = data;
  const isBoys = gym.code === 'BOYS_GYM';

  return (
    <div className="space-y-6">
      {/* Top Facility Banner */}
      <div
        className={`glass-card p-6 rounded-3xl border ${
          isBoys ? 'border-blue-500/30' : 'border-purple-500/30'
        } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${
              isBoys
                ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : 'bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
            }`}
          >
            {isBoys ? '🏋️‍♂️' : '🏃‍♀️'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {gym.name}
              </h1>
              <Badge variant={gym.code}>{gym.code}</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
              <span>Capacity: <strong>{gym.capacity} students/slot</strong></span>
              <span>•</span>
              <span>Hours: <strong>{gym.operatingHours?.open} - {gym.operatingHours?.close}</strong></span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/scanner"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20 flex items-center gap-2 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Launch QR Scanner</span>
          </Link>
          <Link
            to="/attendance"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
          >
            <span>Manual Check-In</span>
          </Link>
        </div>
      </div>

      {/* Facility Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Currently Inside"
          value={stats.currentlyInside}
          subtitle={`Occupancy: ${stats.occupancyPercentage}% of capacity`}
          icon={Flame}
          color={isBoys ? 'blue' : 'purple'}
        />
        <StatCard
          title="Today's Check-Ins"
          value={stats.todayAttendance}
          subtitle="Cumulative daily visits"
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembers}
          subtitle={`Total enrolled: ${stats.totalMembers}`}
          icon={CreditCard}
          color="indigo"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingRequests}
          subtitle="Awaiting manager review"
          icon={ClipboardList}
          color="amber"
        />
      </div>

      {/* Occupancy Gauge & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-Time Facility Occupancy Bar */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Facility Live Occupancy
              </h3>
              <span className="text-sm font-black text-brand-600 dark:text-brand-400">
                {stats.occupancyPercentage}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {stats.currentlyInside} active slots occupied out of {gym.capacity} max limit
            </p>

            <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  stats.occupancyPercentage > 85
                    ? 'bg-rose-500'
                    : stats.occupancyPercentage > 60
                    ? 'bg-amber-500'
                    : isBoys
                    ? 'bg-blue-500'
                    : 'bg-purple-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, stats.occupancyPercentage))}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
              <span className="text-xs text-slate-500 font-medium block">Equipment Health</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {stats.availableEquipment} / {stats.totalEquipment} Ready
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
              <span className="text-xs text-slate-500 font-medium block">On-Duty Trainers</span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {stats.trainersCount} Available
              </span>
            </div>
          </div>
        </div>

        {/* Peak Hours Chart */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Today's Hourly Peak Load
          </h3>
          <p className="text-xs text-slate-500 mb-4">Student arrival traffic distribution by hour</p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`${val} students`, 'Check-ins']}
                  labelFormatter={(h) => `Slot ${h}:00 - ${h + 1}:00`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={isBoys ? '#3B82F6' : '#A855F7'}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Check-Ins for this Facility */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Live Check-In Roster — {gym.name}
          </h3>
          <Link
            to="/attendance"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>View Full Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Check-In Time</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(recentActivity || []).map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                    {item.studentId?.userId?.name || 'Student'}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                    {item.studentId?.rollNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {item.studentId?.department} • Year {item.studentId?.academicYear}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                      {item.method}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.status}>{item.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GymDashboard;
