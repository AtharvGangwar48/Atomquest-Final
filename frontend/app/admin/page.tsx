'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadSessions();
    const interval = setInterval(loadSessions, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const loadSessions = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setSessions(data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async (sessionId: string) => {
    if (!confirm('End this session?')) return;
    try {
      await api.post(`/admin/sessions/${sessionId}/end`);
      await loadSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to end session');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">System monitoring & management</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Live Sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Live Sessions</h2>
            <p className="text-gray-600 text-sm mt-1">
              {sessions.filter((s: any) => s.status === 'active').length} active now
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sessions...</p>
            </div>
          ) : sessions.filter((s: any) => s.status === 'active').length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No active sessions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Session ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions
                    .filter((s: any) => s.status === 'active')
                    .map((session: any) => {
                      const duration = Math.floor(
                        (Date.now() - new Date(session.createdAt).getTime()) / 1000
                      );
                      const mins = Math.floor(duration / 60);
                      const secs = duration % 60;

                      return (
                        <tr
                          key={session.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 text-sm font-mono text-gray-700">
                            {session.roomName?.substring(0, 12)}...
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {session.agent?.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {session.customer?.name || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {mins}m {secs}s
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => endSession(session.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-xs font-medium"
                            >
                              End
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Session History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">All Sessions</h2>
            <p className="text-gray-600 text-sm mt-1">Total: {sessions.length}</p>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No sessions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session: any) => (
                    <tr
                      key={session.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-gray-700">
                        {session.roomName?.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {session.agent?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {session.customer?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            session.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : session.status === 'created'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {session.status === 'active'
                            ? '🟢 Active'
                            : session.status === 'created'
                            ? '🟡 Waiting'
                            : '⚫ Ended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(session.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
