'use client';

import { useEffect, useRef, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { Mic, MicOff, Video, VideoOff, Phone, Send } from 'lucide-react';

interface Msg {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  type: 'text' | 'file';
  createdAt: string;
}

interface VideoRoomProps {
  roomData: { roomToken: string; roomName: string; wsUrl: string; sessionId: string };
  sessionId: string;
  onEndCall: () => void;
}

export default function VideoRoom({ roomData, sessionId, onEndCall }: VideoRoomProps) {
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [recording, setRecording] = useState<any>(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setReconnecting(false);
      socket.emit('join_session', { sessionId });
    });
    socket.on('disconnect', () => setReconnecting(true));
    socket.on('connect_error', () => setReconnecting(true));
    socket.on('chat_history', (msgs: Msg[]) => setMessages(msgs));
    socket.on('new_message', (msg: Msg) => setMessages((p) => [...p, msg]));

    return () => {
      socket.emit('leave_session', { sessionId });
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { sessionId, content: newMessage });
    setNewMessage('');
  };

  const handleEndCall = async () => {
    if (recording) {
      try {
        await api.post(`/recordings/${recording.id}/stop`);
      } catch (err) {
        console.error('Error stopping recording:', err);
      }
    }
    socketRef.current?.emit('leave_session', { sessionId });
    onEndCall();
  };

  const startRecording = async () => {
    try {
      setRecordingStatus('starting');
      const { data } = await api.post('/recordings/start', { sessionId });
      setRecording(data);
      setRecordingStatus('recording');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start recording');
      setRecordingStatus('idle');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      setRecordingStatus('stopping');
      await api.post(`/recordings/${recording.id}/stop`);
      setRecording(null);
      setRecordingStatus('idle');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to stop recording');
      setRecordingStatus('recording');
    }
  };

  return (
    <div className="h-screen flex bg-black relative">
      {/* Reconnecting Overlay */}
      {reconnecting && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Reconnecting...</p>
          </div>
        </div>
      )}

      {/* Video Area */}
      <div className={`relative flex-1 ${showChat ? 'mr-96' : ''}`}>
        <LiveKitRoom
          video={true}
          audio={true}
          token={roomData.roomToken}
          serverUrl={livekitUrl}
          data-lk-theme="dark"
          style={{ height: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>

        {/* Top Controls */}
        <div className="absolute top-4 right-4 flex gap-3 z-10">
          <button
            onClick={() => setShowChat(!showChat)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {showChat ? 'Hide' : 'Show'} Chat
          </button>
          {recordingStatus === 'idle' || recordingStatus === 'stopping' ? (
            <button
              onClick={startRecording}
              disabled={recordingStatus === 'starting'}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              ⏺ Record
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition animate-pulse"
            >
              ⏹ Stop
            </button>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10 bg-black/60 px-6 py-3 rounded-full backdrop-blur-md">
          <button
            title="Mute/Unmute"
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            title="Camera on/off"
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={handleEndCall}
            title="End call"
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="w-96 bg-gray-900 flex flex-col border-l border-gray-700">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700 bg-gray-950">
            <h3 className="text-white font-semibold text-lg">Session Chat</h3>
            <p className="text-gray-400 text-xs mt-1">Messages are saved</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-center text-sm">
                  No messages yet. Start chatting!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs ${isMe ? 'bg-blue-600' : 'bg-gray-700'} rounded-lg px-4 py-2`}>
                      <p className="text-xs text-gray-300 mb-1">
                        {isMe ? 'You' : msg.senderName}
                      </p>
                      <p className="text-white break-words text-sm">{msg.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-700 bg-gray-950">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type message..."
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
