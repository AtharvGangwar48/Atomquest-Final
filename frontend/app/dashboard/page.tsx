'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import {
  Video, Copy, Check, Plus, CalendarClock, Bell, Clock,
  CheckCircle, Users, X, BadgeCheck, History, LayoutDashboard,
  Send, Calendar, ChevronRight, Trash2
} from 'lucide-react';

interface Session { id: string; roomName: string; status: string; customer?: { name: string }; joinToken: string; createdAt: string; }
interface ScheduledSession { id: string; title: string; description?: string; scheduledAt: string; status: string; customer?: { name: string; email: string }; }
interface Customer { id: string; name: string; email: string; }

type Tab = 'overview' | 'history' | 'scheduled';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Scheduled sessions
  const [scheduled, setScheduled] = useState<ScheduledSession[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ title: '', description: '', scheduledAt: '', customerId: '' });
  const [scheduling, setScheduling] = useState(false);

  // Notifications
  const [showNotif, setShowNotif] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'info' as const, recipientIds: [] as string[], selectAll: false });
  const [sending, setSending] = useState(false);
  const [notifSent, setNotifSent] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user || user.role !== 'agent') { router.push('/'); return; }
    loadAll();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, [user, mounted]);

  const loadAll = () => { loadSessions(); loadScheduled(); loadCustomers(); };

  const loadSessions = async () => {
    try { const { data } = await api.get('/sessions/history'); setSessions(data); } catch (e) { console.error(e); }
  };

  const loadScheduled = async () => {
    try { const { data } = await api.get('/scheduled-sessions'); setScheduled(data); } catch (e) { console.error(e); }
  };

  const loadCustomers = async () => {
    try { const { data } = await api.get('/sessions/agent/customers'); setCustomers(data); } catch (e) { console.error(e); }
  };

  const createSession = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/sessions');
      const url = `${window.location.origin}/session/join?token=${data.joinToken}`;
      navigator.clipboard.writeText(url);
      setCopied('new');
      setTimeout(() => setCopied(null), 2000);
      await loadSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create session');
    } finally { setCreating(false); }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/session/join?token=${token}`);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const submitSchedule = async () => {
    if (!scheduleForm.title || !scheduleForm.scheduledAt) return;
    setScheduling(true);
    try {
      await api.post('/scheduled-sessions', { ...scheduleForm, customerId: scheduleForm.customerId || undefined });
      setShowSchedule(false);
      setScheduleForm({ title: '', description: '', scheduledAt: '', customerId: '' });
      await loadScheduled();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule');
    } finally { setScheduling(false); }
  };

  const cancelScheduled = async (id: string) => {
    if (!confirm('Cancel this scheduled session?')) return;
    try { await api.patch(`/scheduled-sessions/${id}/cancel`); await loadScheduled(); } catch (e) { console.error(e); }
  };

  const toggleRecipient = (id: string) => {
    setNotifForm((f) => ({
      ...f,
      recipientIds: f.recipientIds.includes(id) ? f.recipientIds.filter((r) => r !== id) : [...f.recipientIds, id],
      selectAll: false,
    }));
  };

  const toggleSelectAll = () => {
    setNotifForm((f) => ({
      ...f,
      selectAll: !f.selectAll,
      recipientIds: !f.selectAll ? customers.map((c) => c.id) : [],
    }));
  };

  const sendNotification = async () => {
    if (!notifForm.title || !notifForm.message || notifForm.recipientIds.length === 0) return;
    setSending(true);
    try {
      await api.post('/notifications/send', {
        recipientIds: notifForm.recipientIds,
        title: notifForm.title,
        message: notifForm.message,
        type: notifForm.type,
      });
      setNotifSent(true);
      setTimeout(() => { setNotifSent(false); setShowNotif(false); setNotifForm({ title: '', message: '', type: 'info', recipientIds: [], selectAll: false }); }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send');
    } finally { setSending(false); }
  };

  const active = sessions.filter((s) => s.status === 'active').length;
  const completed = sessions.filter((s) => s.status === 'ended').length;
  const upcomingScheduled = scheduled.filter((s) => s.status === 'upcoming').length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-3">Agent Portal</p>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl sm:text-5xl font-bold">
                  {mounted && user?.name ? user.name : 'Agent'}
                </h1>
                <BadgeCheck className="w-9 h-9 text-blue-300 shrink-0" />
              </div>
              <p className="text-blue-100 text-lg">Welcome back! Here's your support overview.</p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={createSession}
                disabled={creating}
                className="flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-3 rounded-xl hover:bg-blue-50 transition disabled:opacity-60 shadow-md"
              >
                {creating ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                {copied === 'new' ? 'Link Copied!' : creating ? 'Creating...' : 'New Session'}
              </button>
              <button
                onClick={() => setShowSchedule(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-3 rounded-xl transition"
              >
                <CalendarClock className="w-4 h-4" /> Schedule
              </button>
              <button
                onClick={() => { setShowNotif(true); loadCustomers(); }}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-3 rounded-xl transition"
              >
                <Bell className="w-4 h-4" /> Notify Customers
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-10 mt-12">
            <div>
              <p className="text-3xl font-bold">{sessions.length}</p>
              <p className="text-blue-200 text-sm mt-1">Total Sessions</p>
            </div>
            <div className="w-px bg-blue-400/30" />
            <div>
              <p className="text-3xl font-bold">{active}</p>
              <p className="text-blue-200 text-sm mt-1">Active Now</p>
            </div>
            <div className="w-px bg-blue-400/30" />
            <div>
              <p className="text-3xl font-bold">{completed}</p>
              <p className="text-blue-200 text-sm mt-1">Completed</p>
            </div>
            <div className="w-px bg-blue-400/30" />
            <div>
              <p className="text-3xl font-bold">{upcomingScheduled}</p>
              <p className="text-blue-200 text-sm mt-1">Upcoming</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-0">
            {([
              { key: 'overview', label: 'Overview', icon: LayoutDashboard },
              { key: 'history', label: 'Session History', icon: History },
              { key: 'scheduled', label: 'Scheduled', icon: Calendar },
            ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition ${
                  tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-8">
            {/* Active sessions */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-green-600" /> Active Sessions
              </h2>
              {sessions.filter((s) => s.status === 'active').length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                  <p className="text-gray-500">No active sessions right now</p>
                  <button onClick={createSession} disabled={creating} className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition">
                    <Plus className="w-4 h-4" /> Create Session
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sessions.filter((s) => s.status === 'active').map((session) => (
                    <SessionCard key={session.id} session={session} copied={copied} onCopy={copyLink} onJoin={() => router.push(`/session/${session.id}`)} />
                  ))}
                </div>
              )}
            </div>

            {/* Waiting sessions */}
            {sessions.filter((s) => s.status === 'created').length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" /> Waiting for Customer
                </h2>
                <div className="grid gap-4">
                  {sessions.filter((s) => s.status === 'created').map((session) => (
                    <SessionCard key={session.id} session={session} copied={copied} onCopy={copyLink} onJoin={() => router.push(`/session/${session.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming scheduled */}
            {scheduled.filter((s) => s.status === 'upcoming').length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-purple-600" /> Upcoming Scheduled
                </h2>
                <div className="grid gap-4">
                  {scheduled.filter((s) => s.status === 'upcoming').slice(0, 3).map((s) => (
                    <ScheduleCard key={s.id} s={s} onCancel={cancelScheduled} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" /> All Sessions ({sessions.length})
            </h2>
            {sessions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No sessions yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Session</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{session.roomName.substring(0, 14)}...</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{session.customer?.name || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            session.status === 'active' ? 'bg-green-100 text-green-700' :
                            session.status === 'created' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {session.status === 'active' ? '🟢 Active' : session.status === 'created' ? '🟡 Waiting' : '⚫ Ended'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(session.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          {session.status === 'created' && (
                            <button onClick={() => copyLink(session.joinToken)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition">
                              {copied === session.joinToken ? '✓ Copied' : 'Copy Link'}
                            </button>
                          )}
                          {session.status === 'active' && (
                            <button onClick={() => router.push(`/session/${session.id}`)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition">
                              Join
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
        )}

        {/* SCHEDULED TAB */}
        {tab === 'scheduled' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" /> Scheduled Sessions ({scheduled.length})
              </h2>
              <button onClick={() => setShowSchedule(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition">
                <Plus className="w-4 h-4" /> Schedule New
              </button>
            </div>
            {scheduled.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <p className="text-gray-500 mb-4">No scheduled sessions yet</p>
                <button onClick={() => setShowSchedule(true)} className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition">
                  <CalendarClock className="w-4 h-4" /> Schedule a Session
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {scheduled.map((s) => <ScheduleCard key={s.id} s={s} onCancel={cancelScheduled} />)}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Schedule Modal */}
      {showSchedule && (
        <Modal title="Schedule a Session" onClose={() => setShowSchedule(false)}>
          <div className="space-y-4">
            <Field label="Title *">
              <input type="text" placeholder="e.g. Product onboarding call" value={scheduleForm.title}
                onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                className="input" />
            </Field>
            <Field label="Description">
              <textarea placeholder="What will you cover?" value={scheduleForm.description} rows={3}
                onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                className="input resize-none" />
            </Field>
            <Field label="Date & Time *">
              <input type="datetime-local" value={scheduleForm.scheduledAt} min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                className="input" />
            </Field>
            <Field label="Assign Customer (optional)">
              <select value={scheduleForm.customerId} onChange={(e) => setScheduleForm({ ...scheduleForm, customerId: e.target.value })} className="input">
                <option value="">— Select customer —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
            </Field>
          </div>
          <ModalActions
            onCancel={() => setShowSchedule(false)}
            onConfirm={submitSchedule}
            disabled={!scheduleForm.title || !scheduleForm.scheduledAt || scheduling}
            loading={scheduling}
            confirmLabel="Schedule"
            confirmClass="bg-purple-600 hover:bg-purple-700"
          />
        </Modal>
      )}

      {/* Notification Modal */}
      {showNotif && (
        <Modal title="Send Notification" onClose={() => setShowNotif(false)}>
          {notifSent ? (
            <div className="py-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-800 font-semibold">Notification sent!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Title *">
                <input type="text" placeholder="Notification title" value={notifForm.title}
                  onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} className="input" />
              </Field>
              <Field label="Message *">
                <textarea placeholder="Your message..." value={notifForm.message} rows={3}
                  onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })} className="input resize-none" />
              </Field>
              <Field label="Type">
                <select value={notifForm.type} onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value as any })} className="input">
                  <option value="info">ℹ️ Info</option>
                  <option value="success">✅ Success</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="meeting">📅 Meeting</option>
                </select>
              </Field>
              <Field label={`Recipients (${notifForm.recipientIds.length} selected)`}>
                {customers.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No customers found. Create sessions first.</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200">
                      <input type="checkbox" checked={notifForm.selectAll} onChange={toggleSelectAll} className="rounded" />
                      <span className="text-sm font-semibold text-gray-700">Select All ({customers.length})</span>
                    </label>
                    <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                      {customers.map((c) => (
                        <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={notifForm.recipientIds.includes(c.id)} onChange={() => toggleRecipient(c.id)} className="rounded" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </Field>
            </div>
          )}
          {!notifSent && (
            <ModalActions
              onCancel={() => setShowNotif(false)}
              onConfirm={sendNotification}
              disabled={!notifForm.title || !notifForm.message || notifForm.recipientIds.length === 0 || sending}
              loading={sending}
              confirmLabel={`Send to ${notifForm.recipientIds.length} customer${notifForm.recipientIds.length !== 1 ? 's' : ''}`}
              confirmClass="bg-blue-600 hover:bg-blue-700"
            />
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function SessionCard({ session, copied, onCopy, onJoin }: { session: Session; copied: string | null; onCopy: (t: string) => void; onJoin: () => void }) {
  const isActive = session.status === 'active';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-green-100' : 'bg-blue-100'}`}>
          <Video className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-blue-600'}`} />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{session.customer?.name ? `with ${session.customer.name}` : 'Waiting for customer'}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {isActive ? '🟢 Active' : '🟡 Waiting'}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(session.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {!isActive && (
          <button onClick={() => onCopy(session.joinToken)} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition">
            {copied === session.joinToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === session.joinToken ? 'Copied' : 'Copy Link'}
          </button>
        )}
        {isActive && (
          <button onClick={onJoin} className="flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition">
            <Video className="w-4 h-4" /> Join Call
          </button>
        )}
      </div>
    </div>
  );
}

function ScheduleCard({ s, onCancel }: { s: ScheduledSession; onCancel: (id: string) => void }) {
  const isPast = new Date(s.scheduledAt) < new Date();
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.status === 'cancelled' ? 'bg-red-50' : 'bg-purple-100'}`}>
          <CalendarClock className={`w-5 h-5 ${s.status === 'cancelled' ? 'text-red-400' : 'text-purple-600'}`} />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{s.title}</p>
          {s.description && <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              s.status === 'cancelled' ? 'bg-red-100 text-red-600' :
              s.status === 'started' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {s.status === 'cancelled' ? '❌ Cancelled' : s.status === 'started' ? '🟢 Started' : '📅 Upcoming'}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />{new Date(s.scheduledAt).toLocaleString()}
              {isPast && s.status === 'upcoming' && <span className="text-orange-500 font-medium ml-1">(overdue)</span>}
            </span>
            {s.customer && <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" />{s.customer.name}</span>}
          </div>
        </div>
      </div>
      {s.status === 'upcoming' && (
        <button onClick={() => onCancel(s.id)} className="flex items-center gap-1.5 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition">
          <Trash2 className="w-4 h-4" /> Cancel
        </button>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ModalActions({ onCancel, onConfirm, disabled, loading, confirmLabel, confirmClass }: any) {
  return (
    <div className="flex gap-3 mt-6">
      <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium text-sm">
        Cancel
      </button>
      <button onClick={onConfirm} disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl transition font-semibold text-sm disabled:opacity-50 ${confirmClass}`}>
        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {confirmLabel}
      </button>
    </div>
  );
}
