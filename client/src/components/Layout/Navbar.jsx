import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Bell, LogOut, Shield, Dumbbell, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../Common/Badge';

const Navbar = ({ onToggleSidebar }) => {
  const { user, studentProfile, logout, isSuperAdmin, isGymManager, activeFacility, setActiveFacility } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 glass border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Campus Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                VISHNU<span className="text-brand-500">FIT</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                VITB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Facility Scope Switcher for Super Admin */}
      <div className="hidden md:flex items-center gap-2">
        {isSuperAdmin && (
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveFacility(null)}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFacility === null
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏛️ All Campus
            </button>
            <button
              onClick={() => setActiveFacility('BOYS_GYM')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFacility === 'BOYS_GYM'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏋️‍♂️ Boys Gym
            </button>
            <button
              onClick={() => setActiveFacility('GIRLS_GYM')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFacility === 'GIRLS_GYM'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🏃‍♀️ Girls Gym
            </button>
          </div>
        )}

        {!isSuperAdmin && user?.assignedGym && (
          <Badge variant={user.assignedGym.code || 'default'} className="text-xs">
            {user.assignedGym.name || 'Assigned Facility'}
          </Badge>
        )}
      </div>

      {/* Right Controls: Theme Toggle, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Shortcut */}
        <Link
          to="/notifications"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-brand-500 absolute top-2 right-2 ring-2 ring-white dark:ring-navy-950" />
        </Link>

        {/* User Profile Details */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <img
            src={
              user?.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`
            }
            alt="Avatar"
            className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover"
          />
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
              {user?.name}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {studentProfile ? studentProfile.rollNumber : user?.role}
            </p>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
