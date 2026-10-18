import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Common/Badge';
import { QrCode, Scan, CheckCircle2, AlertTriangle, ShieldCheck, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const QRScannerPage = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState(null);
  const { user, assignedGymId, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: gyms } = useQuery({
    queryKey: ['gymsList'],
    queryFn: async () => {
      const res = await api.get('/gyms');
      return res.data.gyms;
    },
  });

  const [activeGymId, setActiveGymId] = useState(() => assignedGymId || '');

  useEffect(() => {
    if (assignedGymId && !activeGymId) {
      setActiveGymId(assignedGymId);
    } else if (!activeGymId && gyms && gyms.length > 0) {
      setActiveGymId(gyms[0]._id);
    }
  }, [assignedGymId, gyms]);

  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async (token) => {
      const res = await api.post('/attendance/qr-scan', {
        qrToken: token || tokenInput.trim(),
        gymId: activeGymId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setLastScanResult({
        ...data,
        timestamp: new Date(),
      });
      toast.success(data.message);
      setTokenInput('');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['facilityDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['campusDashboard'] });
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || 'QR Verification failed.';
      toast.error(errorMsg);
      setLastScanResult({
        success: false,
        message: errorMsg,
        timestamp: new Date(),
      });
    },
  });

  // Helper for quick demonstration test tokens
  const generateDemoTokenForStudent = async (email, password) => {
    try {
      // 1. Temporarily fetch token
      const loginRes = await api.post('/auth/login', { email, password });
      const studentToken = loginRes.data.token;

      // 2. Request QR token as that student
      const qrRes = await api.post(
        '/attendance/qr-token',
        {},
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );

      setTokenInput(qrRes.data.token);
      toast.info(`Generated live signed QR token for ${qrRes.data.student.name} (${qrRes.data.student.rollNumber})! Ready to scan.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate demonstration token');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <span className="text-xs font-bold tracking-widest text-brand-600 dark:text-brand-400 uppercase">
            Smart Facility Terminal
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Digital QR Check-In / Check-Out Scanner
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Server-verified cryptographic token scanner with automatic smart-tap toggling
          </p>
        </div>

        {isSuperAdmin && gyms && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Facility:</span>
            <select
              value={activeGymId}
              onChange={(e) => setActiveGymId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              {gyms.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scanner Terminal Panel */}
        <div className="lg:col-span-6 glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scan className="w-5 h-5 text-brand-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Scan Token Input
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Point your terminal barcode scanner or paste the student's dynamic membership card token below. Tokens expire within 60 seconds to prevent fraudulent replays.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!tokenInput) return toast.error('Please enter QR token string');
                scanMutation.mutate(tokenInput);
              }}
              className="space-y-3"
            >
              <textarea
                rows={3}
                placeholder="Paste or scan QR token (payload.hmac_signature)..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-4 py-2.5 font-mono text-xs rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500"
              />

              <button
                type="submit"
                disabled={scanMutation.isPending || !tokenInput}
                className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-50"
              >
                {scanMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Process & Verify Token</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Token Generators */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Generate Live Test Tokens:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  generateDemoTokenForStudent('rahul.varma@vishnu.edu.in', 'Student@123')
                }
                className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-left font-semibold transition border border-blue-500/20"
              >
                Rahul Varma (Boys Gym)
              </button>
              <button
                type="button"
                onClick={() =>
                  generateDemoTokenForStudent('ananya.reddy@vishnu.edu.in', 'Student@123')
                }
                className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-left font-semibold transition border border-purple-500/20"
              >
                Ananya Reddy (Girls Gym)
              </button>
            </div>
          </div>
        </div>

        {/* Scan Result Feedback Card */}
        <div className="lg:col-span-6 glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center min-h-[320px]">
          {lastScanResult ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    lastScanResult.success
                      ? lastScanResult.action === 'CHECKED_IN'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {lastScanResult.success ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : (
                    <AlertTriangle className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {lastScanResult.success
                      ? lastScanResult.action === 'CHECKED_IN'
                        ? 'Student Check-In Confirmed ✅'
                        : 'Student Check-Out Confirmed 🏁'
                      : 'Access Verification Denied ❌'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {new Date(lastScanResult.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {lastScanResult.student && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                  <img
                    src={lastScanResult.student.avatar}
                    alt="Student"
                    className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover"
                  />
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {lastScanResult.student.name}
                    </h4>
                    <p className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      Roll No: {lastScanResult.student.rollNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      Branch: {lastScanResult.student.department}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                {lastScanResult.message}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <QrCode className="w-16 h-16 opacity-30 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300">
                Awaiting Next QR Scan
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Scanned student card verification and check-in confirmation will display here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;
