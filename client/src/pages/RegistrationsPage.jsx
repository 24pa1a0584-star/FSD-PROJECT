import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import DataTable from '../components/Common/DataTable';
import Badge from '../components/Common/Badge';
import Modal from '../components/Common/Modal';
import { ClipboardCheck, Check, X, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const RegistrationsPage = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedReg, setSelectedReg] = useState(null);
  const [actionType, setActionType] = useState(null); // 'APPROVE' | 'REJECT'
  const [remarks, setRemarks] = useState('');
  const [durationMonths, setDurationMonths] = useState(6);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['registrations', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 15,
      });
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/registrations?${params.toString()}`);
      return res.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, remarks, durationMonths }) => {
      const res = await api.patch(`/registrations/${id}/approve`, {
        status: 'APPROVED',
        remarks,
        durationMonths,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Registration approved and active membership issued!');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['campusDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
      setSelectedReg(null);
      setActionType(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Approval failed.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, remarks }) => {
      const res = await api.patch(`/registrations/${id}/reject`, { remarks });
      return res.data;
    },
    onSuccess: () => {
      toast.info('Registration application rejected.');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setSelectedReg(null);
      setActionType(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    },
  });

  const openApproveModal = (row) => {
    setSelectedReg(row);
    setActionType('APPROVE');
    setRemarks('Verified campus enrollment. Approved for regular gym access.');
    setDurationMonths(6);
  };

  const openRejectModal = (row) => {
    setSelectedReg(row);
    setActionType('REJECT');
    setRemarks('Document verification incomplete or non-adherence to facility guidelines.');
  };

  const columns = [
    {
      header: 'Student Applicant',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">
            {row.studentSnapshot?.name || row.studentId?.userId?.name}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {row.studentSnapshot?.rollNumber || row.studentId?.rollNumber}
          </span>
        </div>
      ),
    },
    {
      header: 'Department / Year',
      render: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {row.studentSnapshot?.department || row.studentId?.department} • Year{' '}
          {row.studentSnapshot?.academicYear || row.studentId?.academicYear}
        </span>
      ),
    },
    {
      header: 'Target Facility',
      render: (row) => (
        <Badge variant={row.gymId?.code}>{row.gymId?.name}</Badge>
      ),
    },
    {
      header: 'Preferred Slot',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {row.preferredSlot}
        </span>
      ),
    },
    {
      header: 'Applied Date',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.applicationDate || row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'PENDING' ? (
            <>
              <button
                onClick={() => openApproveModal(row)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => openRejectModal(row)}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 transition shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">
              {row.reviewedBy ? `Reviewed by ${row.reviewedBy.name}` : 'Completed'}
            </span>
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
            Gym Registration Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Student membership approval workflow & facility access verification
          </p>
        </div>

        {/* Status Tab Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          {['PENDING', 'APPROVED', 'REJECTED', ''].map((st) => (
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
              {st || 'All Applications'}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.registrations || []}
        page={page}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage="No registration applications found for this filter."
      />

      {/* Review Action Modal */}
      <Modal
        isOpen={!!actionType}
        onClose={() => {
          setSelectedReg(null);
          setActionType(null);
        }}
        title={actionType === 'APPROVE' ? 'Approve Gym Registration' : 'Reject Gym Registration'}
        maxWidth="max-w-md"
      >
        {selectedReg && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400 block mb-1">Student Details</span>
              <p className="font-bold text-slate-900 dark:text-white">
                {selectedReg.studentSnapshot?.name} ({selectedReg.studentSnapshot?.rollNumber})
              </p>
              <p className="text-slate-500 mt-0.5">
                {selectedReg.studentSnapshot?.department} • Year {selectedReg.studentSnapshot?.academicYear}
              </p>
              <p className="text-brand-600 dark:text-brand-400 mt-1 font-semibold">
                Facility: {selectedReg.gymId?.name}
              </p>
            </div>

            {actionType === 'APPROVE' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Membership Duration
                </label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value={1}>1 Month (Trial Pass)</option>
                  <option value={6}>6 Months (Semester Pass)</option>
                  <option value={12}>12 Months (Academic Year Pass)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {actionType === 'APPROVE' ? 'Approval Notes / Verification Remarks' : 'Rejection Reason'}
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                placeholder="Enter remarks..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedReg(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              {actionType === 'APPROVE' ? (
                <button
                  type="button"
                  disabled={approveMutation.isPending}
                  onClick={() =>
                    approveMutation.mutate({
                      id: selectedReg._id,
                      remarks,
                      durationMonths,
                    })
                  }
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5"
                >
                  {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={rejectMutation.isPending}
                  onClick={() =>
                    rejectMutation.mutate({
                      id: selectedReg._id,
                      remarks,
                    })
                  }
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RegistrationsPage;
