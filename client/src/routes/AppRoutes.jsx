import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/Layout/AppLayout';

import LoginPage from '../pages/LoginPage';
import SuperAdminDashboard from '../pages/SuperAdminDashboard';
import GymDashboard from '../pages/GymDashboard';
import StudentsPage from '../pages/StudentsPage';
import RegistrationsPage from '../pages/RegistrationsPage';
import MembershipsPage from '../pages/MembershipsPage';
import AttendancePage from '../pages/AttendancePage';
import QRScannerPage from '../pages/QRScannerPage';
import MembershipCardPage from '../pages/MembershipCardPage';
import TrainersPage from '../pages/TrainersPage';
import WorkoutPlansPage from '../pages/WorkoutPlansPage';
import EquipmentPage from '../pages/EquipmentPage';
import SchedulesPage from '../pages/SchedulesPage';
import AnnouncementsPage from '../pages/AnnouncementsPage';
import ReportsPage from '../pages/ReportsPage';
import SettingsPage from '../pages/SettingsPage';
import StudentDashboard from '../pages/StudentDashboard';
import StudentProfilePage from '../pages/StudentProfilePage';
import NotificationsPage from '../pages/NotificationsPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Home router based on user role
const RoleBasedHome = () => {
  const { user, isSuperAdmin, isStudent, isGymManager, isStaff, isTrainer } = useAuth();

  if (isSuperAdmin) {
    return <SuperAdminDashboard />;
  }

  if (isStudent) {
    return <StudentDashboard />;
  }

  if (isGymManager || isStaff) {
    return <GymDashboard />;
  }

  if (isTrainer) {
    return <TrainersPage />;
  }

  return <SuperAdminDashboard />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleBasedHome />} />
        <Route path="boys-gym" element={<GymDashboard facilityCode="BOYS_GYM" />} />
        <Route path="girls-gym" element={<GymDashboard facilityCode="GIRLS_GYM" />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="registrations" element={<RegistrationsPage />} />
        <Route path="memberships" element={<MembershipsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="scanner" element={<QRScannerPage />} />
        <Route path="card" element={<MembershipCardPage />} />
        <Route path="trainers" element={<TrainersPage />} />
        <Route path="workouts" element={<WorkoutPlansPage />} />
        <Route path="my-workout" element={<WorkoutPlansPage />} />
        <Route path="equipment" element={<EquipmentPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="student" element={<StudentDashboard />} />
        <Route path="my-attendance" element={<AttendancePage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
