'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { CalendarClock, Clock, CheckCircle, XCircle } from 'lucide-react';

interface MeetingRequest {
  id: string;
  topic: string;
  description: string;
  preferredTime: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  customer?: { name: string; email: string };
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'agent' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Stats {
  totalCustomers: number;
  totalAgents: number;
  totalMeetings: number;
  pendingRequests: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'customers' | 'agents' | 'notifications' | 'meetings'>('stats');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTarget, setNotifTarget] = useState<'all' | 'agents' | 'customers'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadSessions();
    loadMeetingRequests();
    loadUsers();
    loadStats();
    const interval = setInterval(() => { loadSessions(); loadMeetingRequests(); loadStats(); }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const loadSessions = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setSessions(data.activeSessions?.concat(data.historicalSessions || []) || data.sessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMeetingRequests = async () => {
    try {
      const { data } = await api.get('/admin/meeting-requests');
      setMeetingRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const verifyAgent = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/verify`);
      await loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      await loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const sendNotification = async () => {
    if (!notifTitle || !notifMessage) return alert('Title and message required');
    try {
      await api.post('/admin/notifications', { title: notifTitle, message: notifMessage, target: notifTarget });
      setNotifTitle('');
      setNotifMessage('');
      alert('Notification sent!');
    } catch (err) {
      console.error(err);
    }
  };

  const updateRequestStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/admin/meeting-requests/${id}/status`, { status, adminNote: noteInputs[id] || '' });
      await loadMeetingRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update');
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

  const customers = users.filter(u => u.role === 'customer');
  const agents = users.filter(u => u.role === 'agent');

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

      {/* Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { key: 'stats', label: 'Stats' },
              { key: 'customers', label: `Customers (${customers.length})` },
              { key: 'agents', label: `Agents (${agents.length})` },
              { key: 'notifications', label: 'Notifications' },
              { key: 'meetings', label: 'Meetings' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.key
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-sm font-medium text-gray-500">Total Customers</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCustomers}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-sm font-medium text-gray-500">Total Agents</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAgents}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-sm font-medium text-gray-500">Live Meetings</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMeetings}</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-sm font-medium text-gray-500">Pending Requests</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingRequests}</div>
            </div>
          </div>
        )}

        {/* Users Tab (Customers/Agents) */}
        {(activeTab === 'customers' || activeTab === 'agents') && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {activeTab === 'customers' ? 'Customers' : 'Agents'}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {activeTab === 'customers' ? customers.length : agents.length} total
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    {activeTab === 'agents' && (
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    )}
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'customers' ? customers : agents).map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          {user.firstName} {user.lastName}
                          {activeTab === 'agents' && user.isVerified && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                      {activeTab === 'agents' && (
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.isVerified
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        {activeTab === 'agents' && !user.isVerified && (
                          <button
                            onClick={() => verifyAgent(user.id)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Notification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
                <select
                  value={notifTarget}
                  onChange={(e) => setNotifTarget(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="agents">Agents Only</option>
                  <option value="customers">Customers Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <button
                onClick={sendNotification}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
              >
                Send Notification
              </button>
            </div>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <>
            {/* Meeting Requests */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                <CalendarClock className="w-6 h-6 text-purple-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Meeting Requests</h2>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {meetingRequests.filter((r) => r.status === 'pending').length} pending
                  </p>
                </div>
              </div>

              {meetingRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No meeting requests yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {meetingRequests.map((req) => (
                    <div key={req.id} className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <p className="font-semibold text-gray-900">{req.topic}</p>
                            <span
                              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                req.status === 'approved'
                                  ? 'bg-green-100 text-green-700'
                                  : req.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {req.status === 'approved'
                                ? '✅ Approved'
                                : req.status === 'rejected'
                                ? '❌ Rejected'
                                : '🕐 Pending'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">Customer: {req.customer?.name || '—'}</p>
                          {req.description && (
                            <p className="text-sm text-gray-500 mt-1">{req.description}</p>
                          )}
                          <p className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                            <Clock className="w-3 h-3" />
                            Preferred: {new Date(req.preferredTime).toLocaleString()}
                          </p>
                          {req.adminNote && (
                            <p className="text-xs text-gray-500 mt-2 bg-gray-50 px-3 py-2 rounded-lg">
                              Note: {req.adminNote}
                            </p>
                          )}
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex flex-col gap-2 min-w-48">
                            <input
                              type="text"
                              placeholder="Optional note..."
                              value={noteInputs[req.id] || ''}
                              onChange={(e) =>
                                setNoteInputs({ ...noteInputs, [req.id]: e.target.value })
                              }
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateRequestStatus(req.id, 'approved')}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => updateRequestStatus(req.id, 'rejected')}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Agent</th>
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
                              <td className="px-6 py-4 text-sm text-gray-700">{session.agent?.name}</td>
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
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Session</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Agent</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
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
                          <td className="px-6 py-4 text-sm text-gray-700">{session.agent?.name}</td>
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
          </>
        )}
      </main>
    </div>
  );
}
