import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CreditCard,
  UserCheck,
  QrCode,
  Wrench,
  Award,
  Calendar,
  Bell,
  BarChart3,
  Settings,
  User,
  Activity,
  Dumbbell,
  ShieldAlert,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isSuperAdmin, isGymManager, isStaff, isTrainer, isStudent } = useAuth();

  // Navigation Items configuration based on role
  let navItems = [];

  if (isSuperAdmin) {
    navItems = [
      { label: 'Campus Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'Boys Gym Dashboard', path: '/boys-gym', icon: Activity },
      { label: 'Girls Gym Dashboard', path: '/girls-gym', icon: Activity },
      { label: 'Students Directory', path: '/students', icon: Users },
      { label: 'Gym Registrations', path: '/registrations', icon: ClipboardCheck },
      { label: 'Memberships', path: '/memberships', icon: CreditCard },
      { label: 'Smart Attendance', path: '/attendance', icon: UserCheck },
      { label: 'QR Scanner Terminal', path: '/scanner', icon: QrCode },
      { label: 'Equipment Inventory', path: '/equipment', icon: Wrench },
      { label: 'Trainers & Coaches', path: '/trainers', icon: Award },
      { label: 'Workout Schedules', path: '/workouts', icon: Dumbbell },
      { label: 'Facility Timings', path: '/schedules', icon: Calendar },
      { label: 'Announcements', path: '/announcements', icon: Bell },
      { label: 'Campus Analytics', path: '/reports', icon: BarChart3 },
      { label: 'System Settings', path: '/settings', icon: Settings },
    ];
  } else if (isGymManager || isStaff) {
    navItems = [
      { label: 'Facility Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'Enrolled Students', path: '/students', icon: Users },
      { label: 'Pending Approvals', path: '/registrations', icon: ClipboardCheck },
      { label: 'Facility Memberships', path: '/memberships', icon: CreditCard },
      { label: 'Attendance Counter', path: '/attendance', icon: UserCheck },
      { label: 'QR Scanner Terminal', path: '/scanner', icon: QrCode },
      { label: 'Equipment Logs', path: '/equipment', icon: Wrench },
      { label: 'Facility Trainers', path: '/trainers', icon: Award },
      { label: 'Workout Plans', path: '/workouts', icon: Dumbbell },
      { label: 'Operating Schedule', path: '/schedules', icon: Calendar },
      { label: 'Announcements', path: '/announcements', icon: Bell },
    ];
  } else if (isTrainer) {
    navItems = [
      { label: 'Trainer Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'Assigned Trainees', path: '/students', icon: Users },
      { label: 'Workout Plans', path: '/workouts', icon: Dumbbell },
      { label: 'Equipment Availability', path: '/equipment', icon: Wrench },
      { label: 'Gym Schedules', path: '/schedules', icon: Calendar },
      { label: 'Announcements', path: '/announcements', icon: Bell },
    ];
  } else if (isStudent) {
    navItems = [
      { label: 'Student Home', path: '/student', icon: LayoutDashboard },
      { label: 'Digital Membership Card', path: '/card', icon: CreditCard },
      { label: 'My Workout Plan', path: '/my-workout', icon: Dumbbell },
      { label: 'Attendance Log', path: '/my-attendance', icon: UserCheck },
      { label: 'Gym Schedules', path: '/schedules', icon: Calendar },
      { label: 'Campus Notices', path: '/announcements', icon: Bell },
      { label: 'Student Profile', path: '/profile', icon: User },
    ];
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 glass border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Campus Heading */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              VISHNUFIT CAMPUS
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              VITB • Bhimavaram
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/20 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Footer Role Information */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <div className="text-[11px] leading-tight">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                {user?.role?.replace('_', ' ')}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                {user?.assignedGym?.name || 'Central Administration'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
