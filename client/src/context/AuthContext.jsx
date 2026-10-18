import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [studentProfile, setStudentProfile] = useState(() => {
    const saved = localStorage.getItem('studentProfile');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Active facility filter for Super Admin (defaults to null for campus-wide overview)
  const [activeFacility, setActiveFacility] = useState(null);

  useEffect(() => {
    const verifyUserSession = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          setStudentProfile(res.data.studentProfile);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          if (res.data.studentProfile) {
            localStorage.setItem('studentProfile', JSON.stringify(res.data.studentProfile));
          }
          initSocket(token);
        }
      } catch (err) {
        // Session invalid
        setUser(null);
        setStudentProfile(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('studentProfile');
        localStorage.removeItem('token');
        disconnectSocket();
      } finally {
        setLoading(false);
      }
    };

    if (token || user) {
      verifyUserSession();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setUser(res.data.user);
      setStudentProfile(res.data.studentProfile);
      setToken(res.data.token);

      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      if (res.data.studentProfile) {
        localStorage.setItem('studentProfile', JSON.stringify(res.data.studentProfile));
      }

      initSocket(res.data.token);
      return res.data;
    }
  };

  const registerStudent = async (registrationData) => {
    const res = await api.post('/auth/register', registrationData);
    if (res.data.success) {
      setUser(res.data.user);
      setStudentProfile(res.data.studentProfile);
      setToken(res.data.token);

      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      if (res.data.studentProfile) {
        localStorage.setItem('studentProfile', JSON.stringify(res.data.studentProfile));
      }

      initSocket(res.data.token);
      return res.data;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setStudentProfile(null);
      setToken(null);
      setActiveFacility(null);
      localStorage.removeItem('user');
      localStorage.removeItem('studentProfile');
      localStorage.removeItem('token');
      disconnectSocket();
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setStudentProfile(res.data.studentProfile);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (res.data.studentProfile) {
          localStorage.setItem('studentProfile', JSON.stringify(res.data.studentProfile));
        }
      }
    } catch (e) {
      // Ignore
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isGymManager = user?.role === 'GYM_MANAGER';
  const isStaff = user?.role === 'GYM_STAFF';
  const isTrainer = user?.role === 'TRAINER';
  const isStudent = user?.role === 'STUDENT';

  // Current authorized gym ID
  const assignedGymId = user?.assignedGym?._id || user?.assignedGym || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        token,
        loading,
        login,
        registerStudent,
        logout,
        refreshUser,
        isSuperAdmin,
        isGymManager,
        isStaff,
        isTrainer,
        isStudent,
        assignedGymId,
        activeFacility,
        setActiveFacility,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
