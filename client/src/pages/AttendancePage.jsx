import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/Common/DataTable';
import Badge from '../components/Common/Badge';
import { UserCheck, LogIn, LogOut, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AttendancePage = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);

  const { user, assignedGymId, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch gyms list
  const { data: gyms } = useQuery({
    queryKey: ['gymsList'],
    queryFn: async () => {
      const res = await api.get('/gyms');
      return res.data.gyms;
    },
  });

  const [targetGymId, setTargetGymId] = useState(() => assignedGymId || '');

  React.useEffect(() => {
    if (assignedGymId && !targetGymId) {
      setTargetGymId(assignedGymId);
    } else if (!targetGymId && gyms && gyms.length > 0) {
      setTargetGymId(gyms[0]._id);
    }
  }, [assignedGymId, gyms]);

  // Query Attendance Logs
  const { data, isLoading } = useQuery({
    queryKey: ['attendance', page, selectedDate, targetGymId],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 15 });
      if (selectedDate) params.append('date', selectedDate);
      if (targetGymId) params.append('gymId', targetGymId);

      const res = await api.get(`/attendance?${params.toString()}`);
      return res.data;
    },
    refetchInterval: 15000,
  });

  // Manual Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/attendance/check-in', {
        rollNumber: rollNumber.trim().toUpperCase(),
        gymId: targetGymId,
        notes,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Student checked in successfully!');
      setRollNumber('');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['campusDashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Check-in failed.');
    },
  });

  // Manual Check-Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: async (roll) => {
      const res = await api.post('/attendance/check-out', {
        rollNumber: roll || rollNumber.trim().toUpperCase(),
        gymId: targetGymId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Student checked out.');
      if (!data.roll) setRollNumber('');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['campusDashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Check-out failed.');
    },
  });

  const columns = [
    {
      header: 'Student',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">
            {row.studentId?.userId?.name || 'Student'}
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            {row.studentId?.rollNumber}
          </span>
        </div>
      ),
    },
    {
      header: 'Class / Branch',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {row.studentId?.department} • Year {row.studentId?.academicYear}
        </span>
      ),
    },
    {
      header: 'Facility',
      render: (row) => <Badge variant={row.gymId?.code}>{row.gymId?.name}</Badge>,
    },
    {
      header: 'Check-In',
      render: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {new Date(row.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Check-Out / Duration',
      render: (row) => (
        <div className="text-xs">
          {row.checkOutTime ? (
            <span className="text-slate-700 dark:text-slate-300">
              {new Date(row.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                ({row.durationMinutes} mins)
              </strong>
            </span>
          ) : (
            <span className="text-blue-500 font-semibold animate-pulse">In Session</span>
          )}
        </div>
      ),
    },
    {
      header: 'Method',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
          {row.method}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Action',
      render: (row) => (
        <div>
          {row.status === 'ACTIVE' && (
            <button
              onClick={() => checkOutMutation.mutate(row.studentId?.rollNumber)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Check Out</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header & Manual Terminal Bar */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Smart Attendance Terminal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manual attendance tracking with atomic duplicate check-in prevention
            </p>
          </div>

          {/* Facility Selector for Super Admin */}
          {isSuperAdmin && gyms && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Target Facility:</span>
              <select
                value={targetGymId}
                onChange={(e) => setTargetGymId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                {gyms.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Manual Check-In Form */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!rollNumber) return toast.error('Please enter roll number');
              checkInMutation.mutate();
            }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Enter Student Roll Number (e.g. 21PA1A0501)..."
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 text-sm uppercase font-mono font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                disabled={checkInMutation.isPending}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-brand-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>{checkInMutation.isPending ? 'Checking In...' : 'Check In'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!rollNumber) return toast.error('Enter student roll number to check out');
                  checkOutMutation.mutate(rollNumber);
                }}
                disabled={checkOutMutation.isPending}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Check Out</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Date Filter & Logs Table */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Attendance History Logs
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.logs || []}
        page={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No attendance records recorded for this selection."
      />
    </div>
  );
};

export default AttendancePage;
