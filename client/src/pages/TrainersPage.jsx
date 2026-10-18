import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Common/Badge';
import Modal from '../components/Common/Modal';
import { Award, Star, UserPlus, Users, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const TrainersPage = () => {
  const [selectedGym, setSelectedGym] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTrainer, setNewTrainer] = useState({
    name: '',
    email: '',
    password: '',
    gymId: '',
    specialization: '',
    certifications: '',
    bio: '',
    maxStudents: 25,
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

  const { data: trainers, isLoading } = useQuery({
    queryKey: ['trainers', selectedGym],
    queryFn: async () => {
      const params = selectedGym ? `?gymId=${selectedGym}` : '';
      const res = await api.get(`/trainers${params}`);
      return res.data.trainers;
    },
  });

  const addTrainerMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/trainers', {
        ...payload,
        specialization: payload.specialization.split(',').map((s) => s.trim()),
        certifications: payload.certifications.split(',').map((s) => s.trim()),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Trainer created and assigned successfully!');
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      setIsAddModalOpen(false);
      setNewTrainer({
        name: '',
        email: '',
        password: '',
        gymId: '',
        specialization: '',
        certifications: '',
        bio: '',
        maxStudents: 25,
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create trainer.');
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, isAvailable }) => {
      const res = await api.patch(`/trainers/${id}`, { isAvailable: !isAvailable });
      return res.data;
    },
    onSuccess: () => {
      toast.info('Trainer availability updated.');
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Campus Fitness Trainers & Coaches
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified mentors assigned to Vishnu Boys Gym and Vishnu Girls Gym
          </p>
        </div>

        <div className="flex items-center gap-2">
          {gyms && (
            <select
              value={selectedGym}
              onChange={(e) => setSelectedGym(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="">All Facilities</option>
              {gyms.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}

          {(isSuperAdmin || isGymManager) && (
            <button
              onClick={() => {
                if (assignedGymId) {
                  setNewTrainer((prev) => ({ ...prev, gymId: assignedGymId }));
                }
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5 transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Trainer</span>
            </button>
          )}
        </div>
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(trainers || []).map((t) => (
          <div
            key={t._id}
            className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-md transition"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={t.userId?.avatar}
                    alt={t.userId?.name}
                    className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {t.userId?.name}
                    </h3>
                    <Badge variant={t.gymId?.code}>{t.gymId?.name}</Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{t.rating || 4.9}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed line-clamp-3">
                {t.bio}
              </p>

              {/* Specializations */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(t.specialization || []).map((spec, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <strong>{t.activeStudentCount || 0}</strong> / {t.maxStudents} Students
              </span>

              {(isSuperAdmin || isGymManager) ? (
                <button
                  onClick={() =>
                    toggleAvailabilityMutation.mutate({ id: t._id, isAvailable: t.isAvailable })
                  }
                  className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                    t.isAvailable
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40'
                      : 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40'
                  }`}
                >
                  {t.isAvailable ? 'Available' : 'Unavailable'}
                </button>
              ) : (
                <Badge variant={t.isAvailable ? 'AVAILABLE' : 'UNDER_MAINTENANCE'}>
                  {t.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Trainer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Fitness Coach / Trainer"
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTrainer.name || !newTrainer.email || !newTrainer.gymId) {
              return toast.error('Please fill required fields');
            }
            addTrainerMutation.mutate(newTrainer);
          }}
          className="space-y-3.5"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Coach Name
              </label>
              <input
                type="text"
                required
                value={newTrainer.name}
                onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                placeholder="e.g. Vikram Varma"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                required
                value={newTrainer.email}
                onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                placeholder="coach@vishnu.edu.in"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Assigned Facility
              </label>
              <select
                required
                value={newTrainer.gymId}
                onChange={(e) => setNewTrainer({ ...newTrainer, gymId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">Select Facility...</option>
                {gyms?.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Initial Password
              </label>
              <input
                type="password"
                value={newTrainer.password}
                onChange={(e) => setNewTrainer({ ...newTrainer, password: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                placeholder="Default: Trainer@123"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Specializations (comma separated)
            </label>
            <input
              type="text"
              value={newTrainer.specialization}
              onChange={(e) => setNewTrainer({ ...newTrainer, specialization: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              placeholder="Powerlifting, Athletic Conditioning, Pilates"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Certifications (comma separated)
            </label>
            <input
              type="text"
              value={newTrainer.certifications}
              onChange={(e) => setNewTrainer({ ...newTrainer, certifications: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              placeholder="NSCA-CPT, ACE Certified"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Professional Biography
            </label>
            <textarea
              rows={2}
              value={newTrainer.bio}
              onChange={(e) => setNewTrainer({ ...newTrainer, bio: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              placeholder="Dedicated fitness coach with 5+ years experience..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addTrainerMutation.isPending}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition"
            >
              {addTrainerMutation.isPending ? 'Creating...' : 'Save Trainer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TrainersPage;
