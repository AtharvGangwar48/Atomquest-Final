'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import VideoRoom from '@/components/VideoRoom';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    loadSession();
  }, [user, params.id]);

  const loadSession = async () => {
    try {
      const sessionId = params.id as string;

      let data: any;
      if (user!.role === 'agent') {
        // Agent joins their own session directly
        const res = await api.post(`/sessions/${sessionId}/agent-join`);
        data = res.data;
      } else {
        // Customer needs a join token — get it from session info
        const sessionRes = await api.get(`/sessions/${sessionId}`);
        if (sessionRes.data.status === 'ended') {
          alert('This session has ended');
          router.push('/sessions');
          return;
        }
        const res = await api.post('/sessions/join', { token: sessionRes.data.joinToken });
        data = res.data;
      }

      setRoomData(data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load session');
      router.push(user?.role === 'agent' ? '/dashboard' : '/sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = async () => {
    try {
      await api.post(`/sessions/${params.id}/end`);
    } catch {}
    router.push(user?.role === 'agent' ? '/dashboard' : '/sessions');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-white">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!roomData) return null;

  return <VideoRoom roomData={roomData} sessionId={params.id as string} onEndCall={handleEndCall} />;
}
