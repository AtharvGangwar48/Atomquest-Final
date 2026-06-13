'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadDashboard();
    const interval = setInterval(loadDashboard, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const loadDashboard = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setDashboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async (sessionId: string) => {
    if (!confirm('Force end this session?')) return;
    try {
      await api.post(`/admin/sessions/${sessionId}/end`);
      loadDashboard();
    } catch (err) {
      alert('Failed to end session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name}</span>
            <button onClick={logout} className="text-red-600 hover:text-red-700">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-3xl font-bold text-blue-600">{dashboard?.stats.total || 0}</div>
            <div className="text-gray-600 mt-1">Total Sessions</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-3xl font-bold text-green-600">{dashboard?.stats.active || 0}</div>
            <div className="text-gray-600 mt-1">Active Sessions</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="text-3xl font-bold text-gray-600">{dashboard?.stats.endedToday || 0}</div>
            <div className="text-gray-600 mt-1">Ended Today</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Live Sessions</h2>
          </div>
          <div className="divide-y">
            {!dashboard?.activeSessions || dashboard.activeSessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No active sessions</div>
            ) : (
              dashboard.activeSessions.map((session: any) => (
                <div key={session.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{session.roomName}</div>
                    <div className="text-sm text-gray-600">
                      Agent: {session.agent?.name} | Customer: {session.customer?.name || 'Waiting...'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Started: {new Date(session.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => endSession(session.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Force End
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
