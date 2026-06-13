'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'agent') {
      router.push('/');
      return;
    }
    loadSessions();
  }, [user]);

  const loadSessions = async () => {
    try {
      const { data } = await api.get('/sessions/history');
      setSessions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const createSession = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/sessions');
      const fullUrl = `${window.location.origin}${data.joinUrl}`;
      alert(`Session created!\n\nShare this link with customer:\n${fullUrl}`);
      await loadSessions();
    } catch (err: any) {
      alert('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const joinSession = (sessionId: string) => {
    router.push(`/session/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name}</span>
            <button onClick={logout} className="text-red-600 hover:text-red-700">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={createSession}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : '+ Create New Session'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Session History</h2>
          </div>
          <div className="divide-y">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No sessions yet</div>
            ) : (
              sessions.map((session: any) => (
                <div key={session.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <div className="font-medium">Session {session.roomName}</div>
                    <div className="text-sm text-gray-600">
                      Status: <span className={`font-medium ${session.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{new Date(session.createdAt).toLocaleString()}</div>
                  </div>
                  {session.status === 'active' && (
                    <button
                      onClick={() => joinSession(session.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Join
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
