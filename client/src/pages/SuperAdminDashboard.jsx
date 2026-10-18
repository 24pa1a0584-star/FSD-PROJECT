import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
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
  TrendingUp,
  Activity,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1', '#14B8A6'];

const SuperAdminDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['campusDashboard'],
    queryFn: async () => {
      const res = await api.get('/gyms/campus/dashboard');
      return res.data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <LoadingSkeleton count={4} height="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 glass-card rounded-2xl text-center text-rose-500">
        Failed to load campus dashboard data: {error.message}
      </div>
    );
  }

  const { stats, charts, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <span className="text-xs font-bold tracking-widest text-brand-600 dark:text-brand-400 uppercase">
            Campus Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Centralized Campus Gym Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time operational metrics across Vishnu Boys Gym & Vishnu Girls Gym.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* Primary Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle={`Boys: ${stats.boysGymMembers} • Girls: ${stats.girlsGymMembers}`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Memberships"
          value={stats.activeMemberships}
          subtitle="Verified & Current"
          icon={CreditCard}
          color="emerald"
        />
        <StatCard
          title="Pending Applications"
          value={stats.pendingApplications}
          subtitle="Awaiting Verification"
          icon={ClipboardList}
          color="amber"
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendanceTotal}
          subtitle={`Boys: ${stats.boysGymAttendanceToday} • Girls: ${stats.girlsGymAttendanceToday}`}
          icon={UserCheck}
          color="purple"
        />
      </div>

      {/* Secondary Facility Live Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Boys Gym Real-Time Facility Card */}
        <div className="glass-card rounded-3xl p-6 border border-blue-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                🏋️‍♂️
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Vishnu Boys Gym
                </h3>
                <p className="text-xs text-slate-500">Student Activity Complex</p>
              </div>
            </div>
            <Badge variant="BOYS_GYM">Boys Facility</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
              <span className="text-xs text-slate-500 font-medium block">Inside Now</span>
              <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                {stats.currentlyActiveBoys}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
              <span className="text-xs text-slate-500 font-medium block">Capacity</span>
              <span className="text-xl font-extrabold text-slate-800 dark:text-slate-200">
                {stats.boysGymCapacity}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
              <span className="text-xs text-slate-500 font-medium block">Today</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats.boysGymAttendanceToday}
              </span>
            </div>
          </div>
        </div>

        {/* Girls Gym Real-Time Facility Card */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                🏃‍♀️
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Vishnu Girls Gym
                </h3>
                <p className="text-xs text-slate-500">Women Amenities Complex</p>
              </div>
            </div>
            <Badge variant="GIRLS_GYM">Girls Facility</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
              <span className="text-xs text-slate-500 font-medium block">Inside Now</span>
              <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">
                {stats.currentlyActiveGirls}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
              <span className="text-xs text-slate-500 font-medium block">Capacity</span>
              <span className="text-xl font-extrabold text-slate-800 dark:text-slate-200">
                {stats.girlsGymCapacity}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
              <span className="text-xs text-slate-500 font-medium block">Today</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {stats.girlsGymAttendanceToday}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Monthly Trends (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-card rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Campus Gym Usage
              </h3>
              <p className="text-xs text-slate-500">
                Aggregated student attendance across Boys Gym & Girls Gym
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Boys Gym
              </span>
              <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Girls Gym
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.monthlyTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="boys" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Boys Gym" />
                <Bar dataKey="girls" fill="#A855F7" radius={[6, 6, 0, 0]} name="Girls Gym" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Breakdown Pie Chart */}
        <div className="lg:col-span-4 glass-card rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Department Enrollment
          </h3>
          <p className="text-xs text-slate-500 mb-4">Student memberships by branch</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.departmentDistribution || []}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {(charts?.departmentDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {(charts?.departmentDistribution || []).slice(0, 4).map((d, i) => (
              <div key={d.department} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                  {d.department}: <strong>{d.count}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Campus Check-Ins
            </h3>
            <p className="text-xs text-slate-500">Live attendance feed across campus facilities</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Roll Number</th>
                <th className="px-4 py-3">Facility</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(recentActivity || []).map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {item.studentId?.userId?.name || 'Student'}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                    {item.studentId?.rollNumber}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.gymId?.code}>{item.gymId?.name}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                      {item.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

export default SuperAdminDashboard;
