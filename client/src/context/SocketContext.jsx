import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../services/socket';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // 1. Live Check-in Event
    const handleCheckIn = (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['campusDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });

      const studentName = data.studentId?.userId?.name || 'A student';
      const gymName = data.gymId?.name || 'Gym';
      toast.success(`${studentName} checked into ${gymName}`, {
        description: `Roll No: ${data.studentId?.rollNumber || ''}`,
      });
    };

    // 2. Live Check-out Event
    const handleCheckOut = (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['campusDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });

      toast.info('Student checked out', {
        description: `Duration: ${data.durationMinutes || 0} minutes`,
      });
    };

    // 3. New Registration Application
    const handleNewRegistration = (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['campusDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });

      toast.info('New Gym Registration Request Received', {
        description: `Student: ${data.studentSnapshot?.name || 'Student'} (${data.studentSnapshot?.rollNumber || ''})`,
      });
    };

    // 4. Registration Approved
    const handleRegistrationApproved = () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['myCard'] });
    };

    // 5. New Campus / Gym Announcement
    const handleAnnouncement = (data) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.message(`📢 ${data.title}`, {
        description: data.content,
      });
    };

    // 6. Equipment Alert
    const handleEquipmentAlert = (data) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['campusDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });

      toast.warning(`⚠️ Equipment Alert: ${data.name}`, {
        description: `Status changed to ${data.status}`,
      });
    };

    socket.on('attendance:checkin', handleCheckIn);
    socket.on('attendance:checkout', handleCheckOut);
    socket.on('registration:new', handleNewRegistration);
    socket.on('registration:approved', handleRegistrationApproved);
    socket.on('announcement:new', handleAnnouncement);
    socket.on('equipment:alert', handleEquipmentAlert);

    return () => {
      socket.off('attendance:checkin', handleCheckIn);
      socket.off('attendance:checkout', handleCheckOut);
      socket.off('registration:new', handleNewRegistration);
      socket.off('registration:approved', handleRegistrationApproved);
      socket.off('announcement:new', handleAnnouncement);
      socket.off('equipment:alert', handleEquipmentAlert);
    };
  }, [user, queryClient]);

  return <SocketContext.Provider value={{}}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
