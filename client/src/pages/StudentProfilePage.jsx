import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/Common/Badge';
import { User, Mail, Phone, Lock, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';

const StudentProfilePage = () => {
  const { user, studentProfile, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await api.patch('/auth/update-profile', { name, phone });
      await refreshUser();
      toast.success('Profile information updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsChangingPass(true);
    try {
      await api.patch('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Student Profile & Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Personal identification, institutional credentials, and security
        </p>
      </div>

      {/* Identity Card */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-5">
        <img
          src={user?.avatar}
          alt="Avatar"
          className="w-16 h-16 rounded-2xl border-2 border-brand-500/30 object-cover"
        />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h2>
            <Badge variant="STUDENT">STUDENT</Badge>
          </div>
          <p className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 mt-0.5">
            Roll No: {studentProfile?.rollNumber || 'N/A'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {studentProfile?.department} • Year {studentProfile?.academicYear} (Sec {studentProfile?.section}) • {studentProfile?.studentType}
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleUpdateProfile}
        className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4"
      >
        <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          Personal Details
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            Institutional Email (Read Only)
          </label>
          <input
            type="email"
            disabled
            value={user?.email || ''}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            Contact Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
          />
        </div>

        <button
          type="submit"
          disabled={isUpdating}
          className="px-5 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          <span>{isUpdating ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </form>

      {/* Change Password Form */}
      <form
        onSubmit={handleChangePassword}
        className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4"
      >
        <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-500" />
          <span>Update Security Password</span>
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            Current Password
          </label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            New Password (minimum 6 characters)
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isChangingPass}
          className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition flex items-center gap-1.5"
        >
          <span>{isChangingPass ? 'Updating...' : 'Update Password'}</span>
        </button>
      </form>
    </div>
  );
};

export default StudentProfilePage;
