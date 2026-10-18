import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Badge from '../components/Common/Badge';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

const SchedulesPage = () => {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const res = await api.get('/schedules');
      return res.data.schedules;
    },
  });

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Campus Gym Operating Schedules
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Weekly operational shifts and special training hours for Boys Gym and Girls Gym
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Boys Gym Schedule */}
        <div className="glass-card rounded-3xl p-6 border border-blue-500/20">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏋️‍♂️</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Vishnu Boys Gym
              </h2>
            </div>
            <Badge variant="BOYS_GYM">Boys Gym</Badge>
          </div>

          <div className="space-y-2.5">
            {(schedules || [])
              .filter((s) => s.gymId?.code === 'BOYS_GYM')
              .map((item) => (
                <div
                  key={item._id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 w-24">
                    {item.dayName}
                  </span>
                  {item.isClosed ? (
                    <span className="text-rose-500 font-bold">Closed (Sanitation)</span>
                  ) : (
                    <div className="text-right">
                      <span className="text-slate-600 dark:text-slate-300 block font-medium">
                        🌅 Morning: {item.morningSlot?.openTime} - {item.morningSlot?.closeTime}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 block font-medium">
                        🌆 Evening: {item.eveningSlot?.openTime} - {item.eveningSlot?.closeTime}
                      </span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Girls Gym Schedule */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏃‍♀️</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Vishnu Girls Gym
              </h2>
            </div>
            <Badge variant="GIRLS_GYM">Girls Gym</Badge>
          </div>

          <div className="space-y-2.5">
            {(schedules || [])
              .filter((s) => s.gymId?.code === 'GIRLS_GYM')
              .map((item) => (
                <div
                  key={item._id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 w-24">
                    {item.dayName}
                  </span>
                  {item.isClosed ? (
                    <span className="text-rose-500 font-bold">Closed (Sanitation)</span>
                  ) : (
                    <div className="text-right">
                      <span className="text-slate-600 dark:text-slate-300 block font-medium">
                        🌅 Morning: {item.morningSlot?.openTime} - {item.morningSlot?.closeTime}
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 block font-medium">
                        🌆 Evening: {item.eveningSlot?.openTime} - {item.eveningSlot?.closeTime}
                      </span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulesPage;
