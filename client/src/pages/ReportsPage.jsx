import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import StatCard from '../components/Common/StatCard';
import Badge from '../components/Common/Badge';
import { BarChart3, TrendingUp, Download, PieChart as PieIcon, Activity } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1'];

const ReportsPage = () => {
  const [months, setMonths] = useState(6);

  const { data: comparison } = useQuery({
    queryKey: ['reportComparison'],
    queryFn: async () => {
      const res = await api.get('/reports/gym-comparison');
      return res.data.comparison;
    },
  });

  const { data: attendanceStats } = useQuery({
    queryKey: ['reportAttendance', months],
    queryFn: async () => {
      const res = await api.get(`/reports/attendance?months=${months}`);
      return res.data.stats;
    },
  });

  const { data: departmentStats } = useQuery({
    queryKey: ['reportDepartments'],
    queryFn: async () => {
      const res = await api.get('/reports/departments');
      return res.data.departments;
    },
  });

  const { data: equipmentStats } = useQuery({
    queryKey: ['reportEquipment'],
    queryFn: async () => {
      const res = await api.get('/reports/equipment');
      return res.data.breakdown;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Campus Gym Analytics & Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated utilization reports computed directly via MongoDB pipelines
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Summary Report</span>
        </button>
      </div>

      {/* Boys Gym vs Girls Gym Facility Comparison */}
      {comparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-3xl p-6 border border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Vishnu Boys Gym
              </h3>
              <Badge variant="BOYS_GYM">Boys Facility</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                <span className="text-xs text-slate-500 block">Enrolled</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {comparison.boysGym?.totalStudents}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                <span className="text-xs text-slate-500 block">Active Passes</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {comparison.boysGym?.activeMembers}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                <span className="text-xs text-slate-500 block">All-time Scans</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-200">
                  {comparison.boysGym?.totalAttendanceLogs}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Vishnu Girls Gym
              </h3>
              <Badge variant="GIRLS_GYM">Girls Facility</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                <span className="text-xs text-slate-500 block">Enrolled</span>
                <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                  {comparison.girlsGym?.totalStudents}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                <span className="text-xs text-slate-500 block">Active Passes</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {comparison.girlsGym?.activeMembers}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60">
                <span className="text-xs text-slate-500 block">All-time Scans</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-200">
                  {comparison.girlsGym?.totalAttendanceLogs}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Breakdown Table */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
          Branch-Wise Student Membership & Residency Breakdown
        </h3>
        <p className="text-xs text-slate-500 mb-4">Distribution by hosteller vs day scholar status</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-bold text-slate-400">
              <tr>
                <th className="px-4 py-3">Academic Department</th>
                <th className="px-4 py-3">Total Registered</th>
                <th className="px-4 py-3">Hostellers</th>
                <th className="px-4 py-3">Day Scholars</th>
                <th className="px-4 py-3">Hosteller %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(departmentStats || []).map((dept) => (
                <tr key={dept._id}>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {dept._id}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {dept.count}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {dept.hostellers}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {dept.dayScholars}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      {Math.round((dept.hostellers / dept.count) * 100)}%
                    </span>
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

export default ReportsPage;
