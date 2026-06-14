'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { Video, ArrowLeft } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'customer' as 'agent' | 'customer',
    employeeId: '',
  });

  useEffect(() => {
    if (searchParams.get('mode') === 'register') setIsLogin(false);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isLogin && form.role === 'agent' && !form.employeeId) {
      setError('Employee ID is required for agents');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, form);
      setAuth(data.user, data.accessToken);

      const pendingToken = localStorage.getItem('pendingJoinToken');
      if (pendingToken) {
        localStorage.removeItem('pendingJoinToken');
        router.push(`/session/join?token=${pendingToken}`);
      } else {
        if (data.user.role === 'admin') router.push('/admin');
        else if (data.user.role === 'agent') router.push('/dashboard');
        else router.push('/sessions');
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot reach server. The backend may be waking up (Render free tier ~30s). Please try again.');
      } else {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    setForm((f) => ({ ...f, email, password }));
  };

  return (
    <div className="min-h-screen bg-white flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Atomberg</span>
        </div>

        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Personalized<br />Video Chat Service
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            Connect with support agents through secure, server-routed video calls. No P2P — all media stays on your infrastructure.
          </p>
          <div className="space-y-3">
            {[
              '🎥 LiveKit SFU — works behind firewalls',
              '💬 Real-time chat with file sharing',
              '📅 Schedule meetings with agents',
              '🔔 In-app notifications',
              '🛡️ JWT secured, Bcrypt passwords',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-blue-100 text-sm">
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-sm">© {new Date().getFullYear()} Atomberg · Built for AtomQuest Hackathon</p>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Atomberg</span>
        </div>

        <button
          onClick={() => router.push('/home')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition mb-8 w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="max-w-sm w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {isLogin ? 'Sign in to your Atomberg account' : 'Join Atomberg as a customer or agent'}
          </p>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
            {['Login', 'Register'].map((label) => {
              const active = label === 'Login' ? isLogin : !isLogin;
              return (
                <button
                  key={label}
                  onClick={() => { setIsLogin(label === 'Login'); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text" placeholder="John Doe" value={form.name} required
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" placeholder="you@example.com" value={form.email} required
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password" placeholder="••••••••" value={form.password} required
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as 'agent' | 'customer' })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="customer">Customer</option>
                    <option value="agent">Support Agent</option>
                  </select>
                </div>
                {form.role === 'agent' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" placeholder="EMP12345" value={form.employeeId} required
                      onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">Admin verifies your account before first login</p>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition mt-2 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Demo credentials */}
          {isLogin && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Demo Credentials</p>
              <div className="space-y-2">
                {[
                  { label: '🔴 Admin', email: 'admin-vcp@atomquest.com', password: 'Admin123' },
                  { label: '🔵 Agent', email: 'agent@demo.com', password: 'password123' },
                  { label: '🟢 Customer', email: 'customer@demo.com', password: 'password123' },
                ].map(({ label, email, password }) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => fillDemo(email, password)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-200 rounded-xl transition text-left group"
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{label}</p>
                      <p className="text-xs text-gray-400">{email}</p>
                    </div>
                    <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition font-medium">Fill →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-300 mt-10 lg:hidden text-center">
          © {new Date().getFullYear()} Atomberg · AtomQuest Hackathon
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginContent />
    </Suspense>
  );
}
