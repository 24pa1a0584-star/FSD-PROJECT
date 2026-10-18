import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Badge from '../components/Common/Badge';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { toast } from 'sonner';

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/all/read');
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.notifications || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Notifications & System Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personal updates on registration approvals, attendance, and workouts
          </p>
        </div>

        {data?.unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read ({data.unreadCount})</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No notifications at this time.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => {
                if (!n.isRead) markReadMutation.mutate(n._id);
              }}
              className={`p-4 rounded-2xl glass-card border transition-all cursor-pointer ${
                !n.isRead
                  ? 'border-brand-500/40 bg-brand-50/20 dark:bg-brand-950/20'
                  : 'border-slate-200 dark:border-slate-800 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      !n.isRead ? 'bg-brand-500' : 'bg-transparent'
                    }`}
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {n.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
