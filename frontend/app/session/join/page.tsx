'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

export default function JoinSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!user) {
      // Save token so we can resume after login
      if (token) localStorage.setItem('pendingJoinToken', token);
      router.push('/');
      return;
    }

    if (token) {
      handleJoin(token);
    } else {
      setError('No session token provided');
    }
  }, [user, searchParams]);

  const handleJoin = async (token: string) => {
    setJoining(true);
    setError('');
    try {
      const { data } = await api.post('/sessions/join', { token });
      router.push(`/session/${data.sessionId}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to join session';
      setError(msg);
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {joining && !error ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Joining Session</h2>
            <p className="text-gray-600">Connecting you to the support agent...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Join</h2>
            <p className="text-red-600 mb-6 text-sm">{error}</p>
            <button
              onClick={() => router.push('/sessions')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
            >
              Back to Sessions
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
