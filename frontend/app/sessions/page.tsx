'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { Video, Clock, CheckCircle, ArrowRight, Calendar, Plus, X, CalendarClock } from 'lucide-react';

interface MeetingRequest {
  id: string;
  topic: string;
  description: string;
  preferredTime: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
}

export default function SessionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [joiningManual, setJoiningManual] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Schedule modal state
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ topic: '', description: '', preferredTime: '' });
  const [scheduling, setScheduling] = useState(false);
  const [myRequests, setMyRequests] = useState<MeetingRequest[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) { router.push('/'); return; }
    loadSessions();
    loadMyRequests();
    const interval = setInterval(() => { loadSessions(); loadMyRequests(); }, 5000);
    return () => clearInterval(interval);
  }, [user, mounted]);

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

  const loadMyRequests = async () => {
    try {
      const { data } = await api.get('/meeting-requests/my');
      setMyRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const joinSession = async (sessionId: string) => {
    setJoiningId(sessionId);
    try {
      const session = sessions.find((s: any) => s.id === sessionId);
      if (session?.joinToken) {
        const { data } = await api.post('/sessions/join', { token: (session as any).joinToken });
        router.push(`/session/${data.sessionId}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to join session');
      setJoiningId(null);
    }
  };

  const joinWithToken = async () => {
    if (!manualToken.trim()) return;
    let token = manualToken.trim();
    try { const url = new URL(token); token = url.searchParams.get('token') || token; } catch {}
    setJoiningManual(true);
    try {
      const { data } = await api.post('/sessions/join', { token });
      router.push(`/session/${data.sessionId}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invalid token');
      setJoiningManual(false);
    }
  };

  const submitSchedule = async () => {
    if (!scheduleForm.topic || !scheduleForm.preferredTime) return;
    setScheduling(true);
    try {
      await api.post('/meeting-requests', scheduleForm);
      setShowSchedule(false);
      setScheduleForm({ topic: '', description: '', preferredTime: '' });
      await loadMyRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setScheduling(false);
    }
  };

  const active = sessions.filter((s: any) => s.status === 'active').length;
  const completed = sessions.filter((s: any) => s.status === 'ended').length;

  const statusBadge = (status: MeetingRequest['status']) => {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const statusLabel = (status: MeetingRequest['status']) => {
    if (status === 'approved') return '✅ Approved';
    if (status === 'rejected') return '❌ Rejected';
    return '🕐 Pending';
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <p className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-3">Customer Portal</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">
            Welcome back{mounted && user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-blue-100 text-lg max-w-xl">
            Connect with a support agent instantly via live video chat or schedule a meeting for later.
          </p>
          <div className="flex gap-8 mt-10">
            <div>
              <p className="text-3xl font-bold">{sessions.length}</p>
              <p className="text-blue-200 text-sm mt-1">Total Sessions</p>
            </div>
            <div className="w-px bg-blue-400/40" />
            <div>
              <p className="text-3xl font-bold">{active}</p>
              <p className="text-blue-200 text-sm mt-1">Active Now</p>
            </div>
            <div className="w-px bg-blue-400/40" />
            <div>
              <p className="text-3xl font-bold">{completed}</p>
              <p className="text-blue-200 text-sm mt-1">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-10">

        {/* Join + Schedule row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Join a New Meeting */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Video className="w-5 h-5 text-blue-600" /> Join a Meeting
            </h2>
            <p className="text-gray-500 text-sm mb-5">Paste the link or token shared by your agent</p>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="https://... or paste token directly"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinWithToken()}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={joinWithToken}
                disabled={!manualToken.trim() || joiningManual}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
              >
                {joiningManual ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {joiningManual ? 'Joining...' : 'Join Now'}
              </button>
            </div>
          </div>

          {/* Schedule a Meeting */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-purple-600" /> Schedule a Meeting
            </h2>
            <p className="text-gray-500 text-sm mb-5">Request a meeting with a support agent at your preferred time</p>
            <button
              onClick={() => setShowSchedule(true)}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition w-full justify-center"
            >
              <Plus className="w-4 h-4" /> Schedule a Meeting
            </button>
          </div>
        </div>

        {/* My Meeting Requests */}
        {myRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" /> My Meeting Requests
            </h2>
            <div className="grid gap-4">
              {myRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{req.topic}</p>
                    {req.description && <p className="text-sm text-gray-500 mt-0.5">{req.description}</p>}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge(req.status)}`}>
                        {statusLabel(req.status)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        Preferred: {new Date(req.preferredTime).toLocaleString()}
                      </span>
                    </div>
                    {req.adminNote && (
                      <p className="text-xs text-gray-500 mt-2 bg-gray-50 px-3 py-2 rounded-lg">
                        Note: {req.adminNote}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session History */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> Your History
          </h2>
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading your sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-1">No sessions yet</p>
              <p className="text-gray-400 text-sm">Paste a link above to join your first support session</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session: any) => {
                const isActive = session.status === 'active';
                const isEnded = session.status === 'ended';
                return (
                  <div key={session.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-green-100' : isEnded ? 'bg-gray-100' : 'bg-blue-100'}`}>
                        {isEnded ? <CheckCircle className="w-5 h-5 text-gray-500" /> : <Video className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-blue-600'}`} />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {session.agent?.name ? `Agent: ${session.agent.name}` : 'Support Session'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : isEnded ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                            {isActive ? '🟢 In Progress' : isEnded ? '✅ Completed' : '🟡 Waiting'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />{new Date(session.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!isEnded && (
                      <button
                        onClick={() => joinSession(session.id)}
                        disabled={joiningId === session.id}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 whitespace-nowrap ${isActive ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        {joiningId === session.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Video className="w-4 h-4" />}
                        {joiningId === session.id ? 'Joining...' : 'Join Call'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Schedule a Meeting</h3>
              <button onClick={() => setShowSchedule(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Product setup help"
                  value={scheduleForm.topic}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, topic: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Briefly describe what you need help with..."
                  value={scheduleForm.description}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date & Time <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={scheduleForm.preferredTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, preferredTime: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSchedule(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitSchedule}
                disabled={!scheduleForm.topic || !scheduleForm.preferredTime || scheduling}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-semibold text-sm disabled:opacity-50"
              >
                {scheduling ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                {scheduling ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
