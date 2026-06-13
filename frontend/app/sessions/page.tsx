'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

export default function SessionsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [joiningManual, setJoiningManual] = useState(false);

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
      const { data } = await api.get('/sessions/history');
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (sessionId: string) => {
    setJoiningId(sessionId);
    try {
      const session = sessions.find((s: any) => s.id === sessionId);
      if (session?.joinToken) {
        const { data } = await api.post('/sessions/join', { token: session.joinToken });
        router.push(`/session/${data.sessionId}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join session');
      setJoiningId(null);
    }
  };

  const joinWithToken = async () => {
    if (!manualToken.trim()) return;
    setJoiningManual(true);
    try {
      const { data } = await api.post('/sessions/join', { token: manualToken });
      router.push(`/session/${data.sessionId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invalid token');
      setJoiningManual(false);
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
            <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
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
        {/* Join Session Card */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-12 text-white">
            <h2 className="text-3xl font-bold mb-3">Join Support Session</h2>
            <p className="text-purple-100 mb-8 text-lg">
              Paste the link or token shared by an agent
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Paste link or token here..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinWithToken()}
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-white"
              />
              <button
                onClick={joinWithToken}
                disabled={!manualToken.trim() || joiningManual}
                className="px-8 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition disabled:opacity-50 whitespace-nowrap"
              >
                {joiningManual ? 'Joining...' : 'Join Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Sessions ({sessions.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg mb-2">No sessions yet</p>
              <p className="text-gray-400">
                Paste a link above or wait for an agent to invite you
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {sessions.map((session: any) => (
                <div
                  key={session.id}
                  className="p-6 hover:bg-gray-50 transition flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {session.agent?.name || 'Support Agent'}
                    </h3>
                    <div className="flex items-center gap-3">
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
                          ? '🟢 In Progress'
                          : session.status === 'created'
                          ? '🟡 Waiting'
                          : '⚫ Completed'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(session.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {session.status !== 'ended' && (
                    <button
                      onClick={() => joinSession(session.id)}
                      disabled={joiningId === session.id}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-50"
                    >
                      {joiningId === session.id ? 'Joining...' : 'Join Call'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
