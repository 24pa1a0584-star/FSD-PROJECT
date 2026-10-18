import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Shield, User, Key, CheckCircle, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid institutional email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid institutional email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rollNumber: z.string().min(5, 'Roll number is required (e.g. 24PA1A0584)'),
  department: z.enum(['CSE', 'ECE', 'EEE', 'IT', 'MECH', 'CIVIL', 'AI&DS', 'CSBS']),
  academicYear: z.coerce.number().int().min(1).max(4),
  contactNumber: z.string().min(10, 'Contact number is required'),
  studentType: z.enum(['Hosteller', 'Day Scholar']),
  assignedGym: z.string().min(1, 'Please select facility'),
});

const LoginPage = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { login, registerStudent } = useAuth();
  const navigate = useNavigate();

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    setValue: setLoginValue,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    register: regRegister,
    handleSubmit: handleRegSubmit,
    formState: { errors: regErrors, isSubmitting: isRegSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      rollNumber: '',
      department: 'CSE',
      academicYear: 1,
      contactNumber: '',
      studentType: 'Hosteller',
      assignedGym: '',
    },
  });

  const onLogin = async (data) => {
    try {
      const res = await login(data.email, data.password);
      toast.success('Welcome back to VISHNUFIT!');
      if (res.user.role === 'STUDENT') {
        navigate('/student');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    }
  };

  const onRegister = async (data) => {
    try {
      await registerStudent(data);
      toast.success('Registration submitted successfully! Please wait for gym manager verification.');
      navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    }
  };

  const setDemoCredentials = (email, password) => {
    setLoginValue('email', email);
    setLoginValue('password', password);
    toast.info(`Demo credentials set for ${email.split('@')[0]}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-100 dark:bg-navy-950">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: Campus Branding Card */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-full bg-gradient-to-br from-slate-900 to-navy-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 mb-6">
              <Dumbbell className="w-6 h-6" />
            </div>

            <span className="text-xs font-bold tracking-widest text-brand-400 uppercase">
              Vishnu Institute of Technology
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              VISHNU<span className="text-brand-400">FIT</span>
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Centralized campus gym management system with dual-facility governance for <strong>Boys Gym</strong> and <strong>Girls Gym</strong>.
            </p>
          </div>

          <div className="my-6 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span>Logical facility isolation & access control</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span>Real-time smart attendance & dynamic QR cards</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <CheckCircle className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span>Customized student workout schedules & equipment tracking</span>
            </div>
          </div>

          {/* Quick Demo Switcher - Disabled by default in production to protect credentials */}
          {import.meta.env.VITE_SHOW_DEMO_CREDS === 'true' ? (
            <div className="pt-4 border-t border-slate-700/60">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Instant Demo Role Selector:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDemoCredentials('superadmin@vishnu.edu.in', 'SuperAdmin@123')}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-left transition border border-slate-700 text-slate-200"
                >
                  👑 Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('manager.boys@vishnu.edu.in', 'ManagerBoys@123')}
                  className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-left transition border border-blue-800/60 text-blue-200"
                >
                  🏋️‍♂️ Boys Manager
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('manager.girls@vishnu.edu.in', 'ManagerGirls@123')}
                  className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-left transition border border-purple-800/60 text-purple-200"
                >
                  🏃‍♀️ Girls Manager
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('trainer.boys@vishnu.edu.in', 'Trainer@123')}
                  className="p-1.5 rounded-lg bg-teal-950/60 hover:bg-teal-900/60 text-left transition border border-teal-800/60 text-teal-200"
                >
                  💪 Trainer (Boys)
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('rahul.varma@vishnu.edu.in', 'Student@123')}
                  className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-left transition border border-emerald-800/60 text-emerald-200"
                >
                  🎓 Student (Boys)
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('ananya.reddy@vishnu.edu.in', 'Student@123')}
                  className="p-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900/60 text-left transition border border-pink-800/60 text-pink-200"
                >
                  🎓 Student (Girls)
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-700/60 text-xs text-slate-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span>Authorized VITB students & physical education staff access only.</span>
            </div>
          )}
        </div>

        {/* Right Side: Form (Login or Register) */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {isRegisterMode ? 'Student Registration' : 'Account Sign In'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isRegisterMode
                  ? 'Apply for campus gym membership at VITB'
                  : 'Enter your institutional credentials'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              {isRegisterMode ? 'Back to Login' : 'New Student? Register'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!isRegisterMode ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    {...loginRegister('email')}
                    placeholder="user@vishnu.edu.in"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                  />
                </div>
                {loginErrors.email && (
                  <p className="text-xs text-rose-500 mt-1">{loginErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    {...loginRegister('password')}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
                  />
                </div>
                {loginErrors.password && (
                  <p className="text-xs text-rose-500 mt-1">{loginErrors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoginSubmitting}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 mt-2"
              >
                {isLoginSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to VISHNUFIT</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Student Registration Form */
            <form onSubmit={handleRegSubmit(onRegister)} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...regRegister('name')}
                    placeholder="Student Name"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                  {regErrors.name && <p className="text-[11px] text-rose-500">{regErrors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    College Roll Number
                  </label>
                  <input
                    type="text"
                    {...regRegister('rollNumber')}
                    placeholder="24PA1A0584"
                    className="w-full px-3 py-2 text-xs uppercase rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                  {regErrors.rollNumber && <p className="text-[11px] text-rose-500">{regErrors.rollNumber.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    College Email
                  </label>
                  <input
                    type="email"
                    {...regRegister('email')}
                    placeholder="student@vishnu.edu.in"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                  {regErrors.email && <p className="text-[11px] text-rose-500">{regErrors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    {...regRegister('password')}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                  {regErrors.password && <p className="text-[11px] text-rose-500">{regErrors.password.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Branch
                  </label>
                  <select
                    {...regRegister('department')}
                    className="w-full px-2 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="IT">IT</option>
                    <option value="AI&DS">AI&DS</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="CSBS">CSBS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Year (1-4)
                  </label>
                  <select
                    {...regRegister('academicYear')}
                    className="w-full px-2 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Student Type
                  </label>
                  <select
                    {...regRegister('studentType')}
                    className="w-full px-2 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="Hosteller">Hosteller</option>
                    <option value="Day Scholar">Day Scholar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    {...regRegister('contactNumber')}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                  {regErrors.contactNumber && <p className="text-[11px] text-rose-500">{regErrors.contactNumber.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Target Gym Facility
                  </label>
                  <select
                    {...regRegister('assignedGym')}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="">Select Facility...</option>
                    <option value="BOYS_GYM">Vishnu Boys Gym</option>
                    <option value="GIRLS_GYM">Vishnu Girls Gym</option>
                  </select>
                  {regErrors.assignedGym && <p className="text-[11px] text-rose-500">{regErrors.assignedGym.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isRegSubmitting}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 mt-2"
              >
                {isRegSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Submit Gym Registration Application</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
