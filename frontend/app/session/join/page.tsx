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

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const token = searchParams.get('token');
    if (token) {
      handleJoin(token);
    }
  }, [user, searchParams]);

  const handleJoin = async (token: string) => {
    setJoining(true);
    try {
      const { data } = await api.post('/sessions/join', { token });
      router.push(`/session/${data.sessionId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join session');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Joining session...</p>
      </div>
    </div>
  );
}
