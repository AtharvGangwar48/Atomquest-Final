'use client';

import { useRouter } from 'next/navigation';
import {
  Video, Shield, Clock, Users, BadgeCheck, Bell, Calendar,
  MessageSquare, MonitorPlay, Zap, ArrowRight, CheckCircle,
  Star, Lock, Headphones, BarChart3, ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Atomberg</span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-2">Personalized Video Chat</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/login')} className="px-5 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm transition">
              Login
            </button>
            <button onClick={() => router.push('/login?mode=register')} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition shadow-sm">
              Get Started →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff fill-opacity=0.03%3E%3Cpath d=M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Built for AtomQuest Hackathon 2026
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Personalized<br />
              <span className="text-blue-200">Video Chat</span> Service
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              A self-hosted, secure video calling platform connecting customers with support agents — powered by LiveKit SFU, not P2P.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => router.push('/login?mode=register')} className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg shadow-xl hover:bg-blue-50 transition">
                Get Started Free <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => router.push('/login')} className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/30 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition">
                Login to Dashboard
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
            {[
              { label: 'Video via LiveKit SFU', value: 'Server-routed' },
              { label: 'Session join token', value: '24h expiry' },
              { label: 'File sharing in chat', value: 'Images, PDF, Video' },
              { label: 'Real-time chat', value: 'Socket.IO powered' },
            ].map((s) => (
              <div key={s.label} className="text-center bg-white/10 rounded-2xl p-4 border border-white/10">
                <p className="text-white font-bold text-sm">{s.value}</p>
                <p className="text-blue-200 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is Atomberg */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What is Atomberg?</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Atomberg is a <strong>self-hosted video customer support platform</strong> that lets businesses offer face-to-face support to their customers — without relying on any third-party video services. All video, audio, and data stays on <strong>your own infrastructure</strong>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MonitorPlay, color: 'blue',
                title: 'Not Peer-to-Peer',
                desc: 'All media routes through the LiveKit SFU server running in your Docker container — never browser-to-browser. Works reliably behind firewalls and corporate NAT.',
              },
              {
                icon: Lock, color: 'purple',
                title: 'Fully Private',
                desc: 'No third-party video service involved. LiveKit runs on your own server. JWT-secured session tokens expire after 24 hours. Passwords hashed with Bcrypt.',
              },
              {
                icon: Zap, color: 'green',
                title: 'Instant Sessions',
                desc: 'Agents create a session in one click — the shareable join link is instantly copied to clipboard. Customers join via the link without any app download.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition">
                <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center mb-5`}>
                  <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">From account creation to live video call — in under 60 seconds</p>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Register', desc: 'Customer or Agent signs up. Agents need admin verification before their first login.' },
              { step: '02', title: 'Agent Creates Session', desc: 'Agent clicks "New Session" — a unique join link is generated and copied to clipboard instantly.' },
              { step: '03', title: 'Customer Joins', desc: 'Customer pastes the link in browser — no app needed. They\'re connected to the LiveKit room via JWT token.' },
              { step: '04', title: 'Live Video Call', desc: 'Both see each other\'s video. Chat, share files, record the screen — all in real time.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative">
                <div className="bg-blue-600 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center mb-4">{step}</div>
                {step !== '04' && <div className="hidden md:block absolute top-4 left-8 right-0 h-px bg-blue-100" />}
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Three Roles, One Platform</h2>
          <p className="text-center text-gray-500 mb-16">Every role has a dedicated dashboard with role-specific features</p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Customer */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                <Users className="w-8 h-8 mb-3 opacity-90" />
                <h3 className="text-2xl font-bold">Customer</h3>
                <p className="text-green-100 text-sm mt-1">Join sessions, request meetings</p>
              </div>
              <div className="p-6 space-y-3">
                {[
                  'Join live video sessions via agent-shared link',
                  'Paste full URL or token to connect instantly',
                  'Schedule meeting requests with topic & preferred time',
                  'Track request status — Pending / Approved / Rejected',
                  'View complete session history',
                  'Receive in-app notifications from agents',
                  'Chat with file sharing during video calls',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent */}
            <div className="bg-white rounded-2xl border border-blue-200 shadow-md overflow-hidden ring-2 ring-blue-100">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Headphones className="w-8 h-8 opacity-90" />
                  <BadgeCheck className="w-6 h-6 text-blue-200" />
                </div>
                <h3 className="text-2xl font-bold">Agent</h3>
                <p className="text-blue-100 text-sm mt-1">Verified support professionals</p>
              </div>
              <div className="p-6 space-y-3">
                {[
                  'Verified badge ✓ shown after admin approval',
                  'Create instant sessions — link auto-copies to clipboard',
                  'Schedule future sessions with date, time & customer',
                  'Join active sessions via dashboard',
                  'Send notifications to individual or all customers',
                  'Session history — Active, Waiting, Completed',
                  'In-call screen recording (saves as .webm locally)',
                  'Real-time chat with image, video, audio, PDF sharing',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white">
                <Shield className="w-8 h-8 mb-3 opacity-90" />
                <h3 className="text-2xl font-bold">Admin</h3>
                <p className="text-red-100 text-sm mt-1">Full platform control</p>
              </div>
              <div className="p-6 space-y-3">
                {[
                  'Verify agent accounts — grants verified badge',
                  'Remove agents or customers from the platform',
                  'Live stats — total customers, agents, active meetings',
                  'Force-end any live session',
                  'Review & approve/reject customer meeting requests',
                  'Send notifications to agents, customers, or all users',
                  'View full session history across the platform',
                  'Monitor Prometheus + Grafana metrics dashboard',
                ].map((f) => (
                  <div key={f} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Everything You Need</h2>
          <p className="text-center text-gray-500 mb-16">A complete support platform — not just a video call app</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Video, color: 'blue', title: 'LiveKit SFU Video', desc: 'All media server-routed via LiveKit running in your own Docker container. Works behind firewalls. Supports 50+ participants per room.' },
              { icon: MessageSquare, color: 'purple', title: 'Real-time Chat', desc: 'Socket.IO powered in-call messaging with full file sharing — images preview inline, videos play in-chat, audio playable, PDFs downloadable.' },
              { icon: MonitorPlay, color: 'green', title: 'Screen Recording', desc: 'Browser-native MediaRecorder API captures your screen + audio and auto-downloads as .webm — no server cost, completely free.' },
              { icon: Bell, color: 'orange', title: 'In-app Notifications', desc: 'Agents send info, warning, success, or meeting notifications to individual customers or broadcast to all. Bell icon in navbar with unread badge.' },
              { icon: Calendar, color: 'indigo', title: 'Meeting Scheduling', desc: 'Customers submit meeting requests with topic, description, and preferred time. Admin approves or rejects with a custom note back to the customer.' },
              { icon: BadgeCheck, color: 'teal', title: 'Agent Verification', desc: 'Newly registered agents are inactive until admin verifies them. Verified agents get a blue ✓ badge on their dashboard and profile.' },
              { icon: BarChart3, color: 'rose', title: 'Prometheus + Grafana', desc: 'Pre-provisioned metrics dashboard tracking active sessions, total calls, recording counts, and more — all in your local Grafana instance.' },
              { icon: Lock, color: 'gray', title: 'JWT + Bcrypt Security', desc: 'All API routes protected by JWT bearer tokens. Session join tokens expire in 24h. Passwords hashed with Bcrypt cost factor 10.' },
              { icon: Zap, color: 'yellow', title: 'Redis Presence', desc: 'Real-time participant presence tracked in Redis. Reconnection grace period prevents false "left" events on brief disconnections.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition group">
                <div className={`w-10 h-10 bg-${color}-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Tech Stack</h2>
          <p className="text-center text-gray-400 mb-12">Open-source, self-hosted, production-ready</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Next.js 14', role: 'Frontend', color: 'bg-white text-gray-900' },
              { name: 'NestJS', role: 'Backend API', color: 'bg-red-600 text-white' },
              { name: 'PostgreSQL', role: 'Database', color: 'bg-blue-700 text-white' },
              { name: 'LiveKit SFU', role: 'Video Engine', color: 'bg-orange-500 text-white' },
              { name: 'Socket.IO', role: 'Real-time Chat', color: 'bg-gray-700 text-white' },
              { name: 'Redis', role: 'Cache & Presence', color: 'bg-red-500 text-white' },
              { name: 'MinIO', role: 'File Storage', color: 'bg-red-700 text-white' },
              { name: 'Prometheus + Grafana', role: 'Metrics', color: 'bg-orange-600 text-white' },
            ].map(({ name, role, color }) => (
              <div key={name} className="rounded-xl p-4 border border-gray-700 hover:border-gray-500 transition">
                <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${color} mb-2`}>{name}</div>
                <p className="text-gray-400 text-sm">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Star className="w-10 h-10 text-yellow-300 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to try Atomberg?</h2>
          <p className="text-xl text-blue-100 mb-10">
            Register as a customer to join video sessions, or sign up as an agent to start supporting customers today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push('/login?mode=register')} className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 rounded-xl font-bold text-lg shadow-xl hover:bg-blue-50 transition">
              Create Free Account <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={() => router.push('/login')} className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/40 text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition">
              Login
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Atomberg</span>
              </div>
              <p className="text-sm leading-relaxed">
                A self-hosted personalized video chat service built for customer support teams. All media stays on your infrastructure.
              </p>
              <p className="text-xs text-gray-600 mt-4">Built for AtomQuest Hackathon 2024</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition cursor-pointer">Video Calls</span></li>
                <li><span className="hover:text-white transition cursor-pointer">Live Chat</span></li>
                <li><span className="hover:text-white transition cursor-pointer">Scheduling</span></li>
                <li><span className="hover:text-white transition cursor-pointer">Notifications</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Roles</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition cursor-pointer">Customer Portal</span></li>
                <li><span className="hover:text-white transition cursor-pointer">Agent Dashboard</span></li>
                <li><span className="hover:text-white transition cursor-pointer">Admin Panel</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Stack</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition cursor-pointer">Next.js + NestJS</span></li>
                <li><span className="hover:text-white transition cursor-pointer">LiveKit SFU</span></li>
                <li><span className="hover:text-white transition cursor-pointer">PostgreSQL + Redis</span></li>
                <li><span className="hover:text-white transition cursor-pointer">Docker Compose</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <p>© 2026 Atomberg. All rights reserved.</p>
            <p className="text-gray-600">Personalized Video Chat Service · Self-hosted · Open Infrastructure</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
