'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}m ${s}s`;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    ended: 'bg-gray-100 text-gray-600',
    recording: 'bg-red-100 text-red-700',
    processing: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-blue-100 text-blue-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [ending, setEnding] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [user, load]);

  const forceEnd = async (sessionId: string) => {
    if (!confirm('Force end this session?')) return;
    setEnding(sessionId);
    try {
      await api.post(`/admin/sessions/${sessionId}/end`);
      await load();
    } catch { alert('Failed'); }
    finally { setEnding(null); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;

  const stats = data?.stats || {};
  const active: any[] = data?.activeSessions || [];
  const history: any[] = data?.historicalSessions || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-xs text-gray-500">SupportVision Operations</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-700">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Sessions', value: stats.total || 0, color: 'text-blue-600' },
            { label: 'Active Now', value: stats.active || 0, color: 'text-green-600' },
            { label: 'Ended', value: stats.ended || 0, color: 'text-gray-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white p-6 rounded-xl shadow-sm border">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-200 p-1 rounded-lg w-fit">
          {(['active', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition ${activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'active' ? `Active Sessions (${active.length})` : `History (${history.length})`}
            </button>
          ))}
        </div>

        {/* Active Sessions Table */}
        {activeTab === 'active' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Session ID', 'Agent', 'Customer', 'Duration', 'Participants', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {active.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No active sessions</td></tr>
                ) : active.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-medium">{s.agent?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.customer?.name || <span className="text-yellow-600 text-xs">Waiting...</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(s.durationSec)}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                        {[s.agent, s.customer].filter(Boolean).length} / 2
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => forceEnd(s.id)}
                        disabled={ending === s.id}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 disabled:opacity-50"
                      >
                        {ending === s.id ? 'Ending...' : 'Force End'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Historical Sessions Table */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Session ID', 'Agent', 'Customer', 'Date', 'Duration', 'Chat', 'Recordings', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No ended sessions</td></tr>
                ) : history.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-medium">{s.agent?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.endedAt || s.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(s.durationSec)}</td>
                    <td className="px-4 py-3">
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs">{s.chatCount} msgs</span>
                    </td>
                    <td className="px-4 py-3">
                      {s.recordings.length === 0 ? (
                        <span className="text-gray-400 text-xs">None</span>
                      ) : s.recordings.map((r: any) => (
                        <div key={r.id} className="flex items-center gap-1">
                          <StatusBadge status={r.status} />
                          {r.status === 'ready' && r.fileUrl && (
                            <a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline ml-1">↓ MP4</a>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
