'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import VideoRoom from '@/components/VideoRoom';
import { Loader2, AlertCircle } from 'lucide-react';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadSession();
  }, [user, params.id]);

  const loadSession = async () => {
    try {
      setError('');
      const sessionId = params.id as string;

      let data: any;
      if (user!.role === 'agent') {
        const res = await api.post(`/sessions/${sessionId}/agent-join`);
        data = res.data;
      } else {
        const sessionRes = await api.get(`/sessions/${sessionId}`);
        if (sessionRes.data.status === 'ended') {
          setError('This session has ended');
          setTimeout(() => router.push('/sessions'), 2000);
          return;
        }
        const res = await api.post('/sessions/join', { token: sessionRes.data.joinToken });
        data = res.data;
      }

      setRoomData(data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load session';
      setError(msg);
      console.error('Session load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = async () => {
    try {
      await api.post(`/sessions/${params.id}/end`);
    } catch (err) {
      console.error('End call error:', err);
    }
    router.push(user?.role === 'agent' ? '/dashboard' : '/sessions');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-white">Connecting to session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center bg-gray-800 p-8 rounded-lg max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => router.push(user?.role === 'agent' ? '/dashboard' : '/sessions')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!roomData) return null;

  return <VideoRoom roomData={roomData} sessionId={params.id as string} onEndCall={handleEndCall} />;
}
