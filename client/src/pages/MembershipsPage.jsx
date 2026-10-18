import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import DataTable from '../components/Common/DataTable';
import Badge from '../components/Common/Badge';
import Modal from '../components/Common/Modal';
import { CreditCard, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const MembershipsPage = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [renewingMembership, setRenewingMembership] = useState(null);
  const [additionalMonths, setAdditionalMonths] = useState(6);
  const [renewalNotes, setRenewalNotes] = useState('Standard semester membership renewal');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['memberships', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 15,
      });
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/memberships?${params.toString()}`);
      return res.data;
    },
  });

  const renewMutation = useMutation({
    mutationFn: async ({ id, additionalMonths, notes }) => {
      const res = await api.patch(`/memberships/${id}/renew`, {
        additionalMonths,
        notes,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Membership renewed successfully!');
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setRenewingMembership(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Renewal failed.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/memberships/${id}/status`, { status });
      return res.data;
    },
    onSuccess: (data) => {
      toast.info(data.message || 'Status updated.');
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });

  const columns = [
    {
      header: 'Student Member',
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
      header: 'Card ID',
      render: (row) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-semibold">
          {row.qrCardId}
        </span>
      ),
    },
    {
      header: 'Gym Facility',
      render: (row) => <Badge variant={row.gymId?.code}>{row.gymId?.name}</Badge>,
    },
    {
      header: 'Validity Period',
      render: (row) => (
        <div className="text-xs">
          <span className="text-slate-500">
            {new Date(row.startDate).toLocaleDateString()}
          </span>{' '}
          to{' '}
          <strong className="text-slate-800 dark:text-slate-200">
            {new Date(row.endDate).toLocaleDateString()}
          </strong>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRenewingMembership(row)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 transition flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Renew</span>
          </button>
          {row.status === 'ACTIVE' ? (
            <button
              onClick={() => statusMutation.mutate({ id: row._id, status: 'SUSPENDED' })}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 transition"
            >
              Suspend
            </button>
          ) : (
            <button
              onClick={() => statusMutation.mutate({ id: row._id, status: 'ACTIVE' })}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 transition"
            >
              Activate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Gym Memberships
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active and historical student memberships across campus facilities
          </p>
        </div>

        {/* Status Tab Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          {['', 'ACTIVE', 'EXPIRED', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl transition ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st || 'All Memberships'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.memberships || []}
        page={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
        isLoading={isLoading}
      />

      {/* Renewal Modal */}
      <Modal
        isOpen={!!renewingMembership}
        onClose={() => setRenewingMembership(null)}
        title="Renew Gym Membership"
        maxWidth="max-w-md"
      >
        {renewingMembership && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400 block mb-1">Student</span>
              <p className="font-bold text-slate-900 dark:text-white">
                {renewingMembership.studentId?.userId?.name} ({renewingMembership.studentId?.rollNumber})
              </p>
              <p className="text-slate-500 mt-0.5">
                Current Expiration: {new Date(renewingMembership.endDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Extension Duration
              </label>
              <select
                value={additionalMonths}
                onChange={(e) => setAdditionalMonths(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value={1}>Extend by 1 Month</option>
                <option value={6}>Extend by 6 Months (Semester)</option>
                <option value={12}>Extend by 12 Months (Full Year)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Renewal Notes
              </label>
              <input
                type="text"
                value={renewalNotes}
                onChange={(e) => setRenewalNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenewingMembership(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={renewMutation.isPending}
                onClick={() =>
                  renewMutation.mutate({
                    id: renewingMembership._id,
                    additionalMonths,
                    notes: renewalNotes,
                  })
                }
                className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition flex items-center gap-1.5"
              >
                {renewMutation.isPending ? 'Renewing...' : 'Confirm Renewal'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MembershipsPage;
