import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Common/Badge';
import Modal from '../components/Common/Modal';
import { Bell, Plus, Trash2, Megaphone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const AnnouncementsPage = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL',
    priority: 'NORMAL',
    gymId: '',
  });

  const { isSuperAdmin, isGymManager, assignedGymId } = useAuth();
  const queryClient = useQueryClient();

  const { data: gyms } = useQuery({
    queryKey: ['gymsList'],
    queryFn: async () => {
      const res = await api.get('/gyms');
      return res.data.gyms;
    },
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await api.get('/announcements');
      return res.data.announcements;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/announcements', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Announcement broadcasted campus-wide!');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setIsCreateOpen(false);
      setNewNotice({
        title: '',
        content: '',
        targetAudience: 'ALL',
        priority: 'NORMAL',
        gymId: '',
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to post announcement.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      toast.info('Announcement removed.');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Campus Notices & Facility Announcements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time official alerts from physical education administration
          </p>
        </div>

        {(isSuperAdmin || isGymManager) && (
          <button
            onClick={() => {
              if (assignedGymId) {
                setNewNotice((prev) => ({ ...prev, gymId: assignedGymId, targetAudience: 'BOYS_GYM' }));
              }
              setIsCreateOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {(announcements || []).map((notice) => (
          <div
            key={notice._id}
            className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl flex-shrink-0 ${
                  notice.priority === 'HIGH'
                    ? 'bg-rose-500/10 text-rose-500'
                    : 'bg-brand-500/10 text-brand-500'
                }`}
              >
                <Megaphone className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {notice.title}
                  </h3>
                  <Badge variant={notice.gymId?.code || 'default'}>
                    {notice.gymId?.name || 'Campus Wide'}
                  </Badge>
                  {notice.priority === 'HIGH' && <Badge variant="REJECTED">URGENT</Badge>}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                  {notice.content}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-3 font-medium">
                  <span>Posted by: {notice.createdBy?.name || 'Administrator'}</span>
                  <span>•</span>
                  <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {(isSuperAdmin || isGymManager) && (
              <button
                onClick={() => deleteMutation.mutate(notice._id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Delete Announcement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Publish Campus Announcement"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newNotice.title || !newNotice.content) {
              return toast.error('Please enter title and content');
            }
            createMutation.mutate(newNotice);
          }}
          className="space-y-3.5 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={newNotice.title}
              onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              placeholder="e.g. Annual Powerlifting Competition"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
              Facility Scope
            </label>
            <select
              value={newNotice.gymId}
              onChange={(e) => setNewNotice({ ...newNotice, gymId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <option value="">Campus Wide (All Students)</option>
              {gyms?.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={newNotice.priority}
              onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH (Urgent Alert)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
              Announcement Message
            </label>
            <textarea
              rows={4}
              required
              value={newNotice.content}
              onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              placeholder="Enter announcement text..."
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
              disabled={createMutation.isPending}
              className="px-4 py-2 font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition"
            >
              {createMutation.isPending ? 'Publishing...' : 'Broadcast Notice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AnnouncementsPage;
