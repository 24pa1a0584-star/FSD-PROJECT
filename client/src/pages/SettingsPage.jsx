import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Shield, QrCode, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { isSuperAdmin } = useAuth();
  const [settings, setSettings] = useState({
    campusName: 'Vishnu Institute of Technology, Bhimavaram',
    boysGymOpen: true,
    girlsGymOpen: true,
    allowSelfRegistration: true,
    qrTokenExpirySeconds: 60,
    defaultMembershipDurationMonths: 6,
    announcementNotice:
      'Welcome to VISHNUFIT! Please keep digital membership card ready and adhere to campus safety guidelines.',
  });

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Campus gym settings updated successfully!');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Campus Gym Settings & Governance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure facility operation toggles, digital pass security, and registration policies
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
            Institution Configuration
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              Campus Institution Name
            </label>
            <input
              type="text"
              value={settings.campusName}
              onChange={(e) => setSettings({ ...settings, campusName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                  Vishnu Boys Gym Status
                </span>
                <span className="text-[11px] text-slate-500">Allow student check-ins</span>
              </div>
              <input
                type="checkbox"
                checked={settings.boysGymOpen}
                onChange={(e) => setSettings({ ...settings, boysGymOpen: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                  Vishnu Girls Gym Status
                </span>
                <span className="text-[11px] text-slate-500">Allow student check-ins</span>
              </div>
              <input
                type="checkbox"
                checked={settings.girlsGymOpen}
                onChange={(e) => setSettings({ ...settings, girlsGymOpen: e.target.checked })}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Security & QR Settings */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
            Smart Attendance & Pass Security
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Dynamic QR Token Expiry Window
              </label>
              <select
                value={settings.qrTokenExpirySeconds}
                onChange={(e) => setSettings({ ...settings, qrTokenExpirySeconds: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value={30}>30 Seconds (Ultra strict)</option>
                <option value={60}>60 Seconds (Standard recommendation)</option>
                <option value={120}>120 Seconds (High network latency)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Prevents photo sharing by expiring tokens quickly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Default Membership Duration
              </label>
              <select
                value={settings.defaultMembershipDurationMonths}
                onChange={(e) => setSettings({ ...settings, defaultMembershipDurationMonths: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value={1}>1 Month</option>
                <option value={6}>6 Months (1 Academic Semester)</option>
                <option value={12}>12 Months (Full Academic Year)</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                Allow Online Student Self-Registration
              </span>
              <span className="text-[11px] text-slate-500">
                Permits new students to apply online before manager approval
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.allowSelfRegistration}
              onChange={(e) => setSettings({ ...settings, allowSelfRegistration: e.target.checked })}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-md shadow-brand-500/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration Changes</span>
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
