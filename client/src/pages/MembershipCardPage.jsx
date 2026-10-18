import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { CreditCard, RefreshCw, Clock, ShieldCheck, Dumbbell, AlertTriangle } from 'lucide-react';
import Badge from '../components/Common/Badge';
import { toast } from 'sonner';

const MembershipCardPage = () => {
  const [qrToken, setQrToken] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  // Fetch student card profile
  const { data: cardData, isLoading, error } = useQuery({
    queryKey: ['myCard'],
    queryFn: async () => {
      const res = await api.get('/memberships/my-card');
      return res.data.card;
    },
  });

  // Function to fetch a new dynamic short-lived signed QR token
  const refreshQrToken = async () => {
    try {
      const res = await api.post('/attendance/qr-token');
      if (res.data.success) {
        setQrToken(res.data.token);
        setSecondsRemaining(res.data.remainingSeconds || 60);
      }
    } catch (err) {
      console.warn('Could not generate dynamic QR token:', err.message);
    }
  };

  // Initial token fetch when active membership is verified
  useEffect(() => {
    if (cardData && cardData.hasActiveMembership) {
      refreshQrToken();
    }
  }, [cardData]);

  // Countdown timer: auto-refreshes token when it expires
  useEffect(() => {
    if (!qrToken) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          refreshQrToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrToken]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="p-6 glass-card rounded-2xl text-rose-500 text-center">
        Failed to load membership card.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center">
        <span className="text-xs font-bold tracking-widest text-brand-600 dark:text-brand-400 uppercase">
          Vishnu Institute of Technology • Bhimavaram
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
          Digital Campus Gym Pass
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Scan this digital pass at the entrance terminal to log attendance
        </p>
      </div>

      {/* Modern Digital Pass Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50 dark:from-navy-900 dark:to-navy-950 relative overflow-hidden">
        {/* Background Decorative Rings */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white flex items-center justify-center font-bold shadow-md shadow-brand-500/20">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                VISHNUFIT PASS
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                {cardData.gymName}
              </span>
            </div>
          </div>
          <Badge variant={cardData.hasActiveMembership ? 'ACTIVE' : 'EXPIRED'}>
            {cardData.hasActiveMembership ? 'ACTIVE' : 'NO MEMBERSHIP'}
          </Badge>
        </div>

        {/* Student Avatar & Identity */}
        <div className="flex items-center gap-4 my-6">
          <img
            src={cardData.profilePhoto}
            alt="Student"
            className="w-16 h-16 rounded-2xl border-2 border-brand-500/40 object-cover shadow-sm"
          />
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {cardData.studentName}
            </h2>
            <p className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 mt-0.5">
              Roll No: {cardData.rollNumber}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {cardData.department} • Year {cardData.academicYear} (Sec {cardData.section}) • {cardData.studentType}
            </p>
          </div>
        </div>

        {/* Dynamic QR Code Section */}
        {cardData.hasActiveMembership ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-inner">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
              {qrToken ? (
                <QRCodeSVG value={qrToken} size={180} level="H" includeMargin={false} />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Countdown timer badge */}
            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4 text-brand-500" />
              <span>Token auto-refreshes in:</span>
              <span className="font-mono text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md border border-brand-500/30">
                {secondsRemaining}s
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-tight">
              Cryptographically signed token. Dynamic security prevents photo-sharing.
            </p>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-bold text-sm">No Active Membership</h3>
            <p className="text-xs mt-1">
              Please submit a gym registration application or visit your gym manager to activate your card.
            </p>
          </div>
        )}

        {/* Card Footer Details */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Valid Until</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {cardData.membership
                ? new Date(cardData.membership.endDate).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>

          <button
            onClick={refreshQrToken}
            disabled={!cardData.hasActiveMembership}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipCardPage;
