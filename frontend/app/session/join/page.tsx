'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function JoinSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const token = searchParams.get('token');
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
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Joining Session</h2>
            <p className="text-gray-600">Please wait while we connect you...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Join</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/sessions')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Back to Sessions
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
