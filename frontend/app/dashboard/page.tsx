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
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'agent') {
      router.push('/');
      return;
    }
    loadSessions();
    const interval = setInterval(loadSessions, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/sessions/history');
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/sessions');
      const fullUrl = `${window.location.origin}/session/join?token=${data.joinToken}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied('link');
      setTimeout(() => setCopied(null), 2000);
      await loadSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const joinSession = (sessionId: string) => {
    router.push(`/session/${sessionId}`);
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/session/join?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
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
            <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
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
        {/* Create Session Card */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl shadow-lg p-12 text-white">
            <h2 className="text-3xl font-bold mb-3">Create Support Session</h2>
            <p className="text-blue-100 mb-8 text-lg">
              Start a video call with a customer. Share the link and they can join instantly.
            </p>
            <button
              onClick={createSession}
              disabled={creating}
              className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-8 py-4 rounded-lg hover:bg-blue-50 transition disabled:opacity-50"
            >
              {creating ? 'Creating...' : '+ Create Session'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-gray-600 text-sm font-medium mb-2">Active Sessions</div>
            <div className="text-4xl font-bold text-blue-600">
              {sessions.filter((s: any) => s.status === 'active').length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-gray-600 text-sm font-medium mb-2">Total Sessions</div>
            <div className="text-4xl font-bold text-purple-600">{sessions.length}</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-gray-600 text-sm font-medium mb-2">Completed</div>
            <div className="text-4xl font-bold text-green-600">
              {sessions.filter((s: any) => s.status === 'ended').length}
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Session History</h2>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No sessions yet</p>
              <p className="text-gray-400">Click "Create Session" to get started</p>
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
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
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
                        {session.roomName.substring(0, 12)}...
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
                      <td className="px-6 py-4 text-sm space-x-2">
                        {session.status === 'created' && (
                          <button
                            onClick={() => copyLink(session.joinToken)}
                            className="inline-block px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition text-xs font-medium"
                          >
                            {copied === session.joinToken ? '✓ Copied' : 'Copy Link'}
                          </button>
                        )}
                        {session.status === 'active' && (
                          <button
                            onClick={() => joinSession(session.id)}
                            className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-xs font-medium"
                          >
                            Join Call
                          </button>
                        )}
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
