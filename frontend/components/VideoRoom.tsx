'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

interface Msg {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  type: 'text' | 'file';
  fileUrl?: string;
  mimeType?: string;
  createdAt: string;
}

interface VideoRoomProps {
  roomData: { roomToken: string; roomName: string; wsUrl: string; sessionId: string };
  sessionId: string;
  onEndCall: () => void;
}

function Controls({ onEndCall, socket, sessionId }: { onEndCall: () => void; socket: Socket | null; sessionId: string }) {
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const toggleMic = useCallback(async () => {
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
    socket?.emit('media_state', { sessionId, audio: next, video: camOn });
  }, [localParticipant, micOn, camOn, socket, sessionId]);

  const toggleCam = useCallback(async () => {
    const next = !camOn;
    await localParticipant.setCameraEnabled(next);
    setCamOn(next);
    socket?.emit('media_state', { sessionId, audio: micOn, video: next });
  }, [localParticipant, camOn, micOn, socket, sessionId]);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
      <button onClick={toggleMic} className={`px-5 py-3 rounded-full font-medium text-white transition ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-yellow-600 hover:bg-yellow-500'}`}>
        {micOn ? '🎤 Mute' : '🔇 Unmute'}
      </button>
      <button onClick={toggleCam} className={`px-5 py-3 rounded-full font-medium text-white transition ${camOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-yellow-600 hover:bg-yellow-500'}`}>
        {camOn ? '📷 Cam Off' : '📷 Cam On'}
      </button>
      <button onClick={onEndCall} className="px-5 py-3 rounded-full font-medium text-white bg-red-600 hover:bg-red-500 transition">
        📞 End Call
      </button>
    </div>
  );
}

function FileMessage({ msg }: { msg: Msg }) {
  const isImage = msg.mimeType?.startsWith('image/');
  const isPdf = msg.mimeType === 'application/pdf';
  if (isImage) {
    return (
      <a href={msg.fileUrl} target="_blank" rel="noreferrer">
        <img src={msg.fileUrl} alt={msg.content} className="max-w-[200px] rounded-lg mt-1 cursor-pointer hover:opacity-90" />
        <p className="text-xs text-gray-300 mt-1">{msg.content}</p>
      </a>
    );
  }
  return (
    <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 mt-1 hover:opacity-80">
      <span className="text-2xl">{isPdf ? '📄' : '📎'}</span>
      <span className="text-sm text-blue-300 underline truncate max-w-[160px]">{msg.content}</span>
    </a>
  );
}

export default function VideoRoom({ roomData, sessionId, onEndCall }: VideoRoomProps) {
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [recording, setRecording] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io('http://localhost:3001', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });
    socketRef.current = socket;

    socket.on('connect', () => { setReconnecting(false); socket.emit('join_session', { sessionId }); });
    socket.on('disconnect', () => setReconnecting(true));
    socket.on('connect_error', () => setReconnecting(true));
    socket.on('chat_history', (msgs: Msg[]) => setMessages(msgs));
    socket.on('new_message', (msg: Msg) => setMessages((p) => [...p, msg]));
    socket.on('participants', setParticipants);
    socket.on('participant_joined', (p) => setParticipants((prev) => [...prev.filter((x) => x.userId !== p.userId), p]));
    socket.on('participant_left', (p) => setParticipants((prev) => prev.filter((x) => x.userId !== p.userId)));
    socket.on('participant_reconnecting', (p) => setParticipants((prev) => prev.map((x) => x.userId === p.userId ? { ...x, status: 'reconnecting' } : x)));
    socket.on('participant_reconnected', (p) => setParticipants((prev) => prev.map((x) => x.userId === p.userId ? { ...x, status: 'joined' } : x)));
    socket.on('peer_media_state', (p) => setParticipants((prev) => prev.map((x) => x.userId === p.userId ? { ...x, audio: p.audio, video: p.video } : x)));

    return () => { socket.emit('leave_session', { sessionId }); socket.disconnect(); };
  }, [sessionId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { sessionId, content: newMessage });
    setNewMessage('');
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post(`/chat/${sessionId}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Broadcast file message via socket so all participants see it
      socketRef.current?.emit('send_file_message', { sessionId, messageId: data.id });
      // Optimistically add to local state
      setMessages((p) => [...p, data]);
    } catch { alert('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleEndCall = async () => {
    socketRef.current?.emit('leave_session', { sessionId });
    onEndCall();
  };

  const startRecording = async () => {
    try {
      const { data } = await api.post('/recordings/start', { sessionId });
      setRecording(data);
    } catch { alert('Failed to start recording'); }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await api.post(`/recordings/${recording.id}/stop`);
      setRecording(null);
    } catch { alert('Failed to stop recording'); }
  };

  return (
    <div className="h-screen flex bg-gray-900 relative">
      {reconnecting && (
        <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
            <p className="text-xl font-semibold">Reconnecting...</p>
          </div>
        </div>
      )}

      <div className={`relative flex-1 ${showChat ? 'mr-80' : ''}`}>
        <LiveKitRoom video={true} audio={true} token={roomData.roomToken} serverUrl={roomData.wsUrl} data-lk-theme="default" style={{ height: '100%' }}>
          <VideoConference />
          <RoomAudioRenderer />
          <Controls onEndCall={handleEndCall} socket={socketRef.current} sessionId={sessionId} />
        </LiveKitRoom>

        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button onClick={() => setShowChat(!showChat)} className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm">
            {showChat ? 'Hide Chat' : 'Show Chat'}
          </button>
          {!recording ? (
            <button onClick={startRecording} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">⏺ Record</button>
          ) : (
            <button onClick={stopRecording} className="bg-red-600 text-white px-4 py-2 rounded-lg animate-pulse text-sm">⏹ Stop</button>
          )}
        </div>

        {participants.length > 0 && (
          <div className="absolute top-4 left-4 z-10 space-y-1">
            {participants.map((p) => (
              <div key={p.userId} className="bg-black/50 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${p.status === 'reconnecting' ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                {p.userName}{p.audio === false && ' 🔇'}{p.video === false && ' 📷'}
              </div>
            ))}
          </div>
        )}
      </div>

      {showChat && (
        <div className="w-80 bg-gray-800 flex flex-col absolute right-0 top-0 h-full">
          <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-semibold">Chat</h3>
            <span className="text-xs text-gray-400">{participants.length} in call</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-gray-400 mb-1">{isMe ? 'You' : msg.senderName}</span>
                  <div className={`px-3 py-2 rounded-lg max-w-[90%] ${isMe ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    {msg.type === 'file' ? (
                      <FileMessage msg={msg} />
                    ) : (
                      <p className="text-white text-sm">{msg.content}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-gray-900 border-t border-gray-700">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">Send</button>
            </div>
            <div>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full bg-gray-700 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-600 text-sm disabled:opacity-50"
              >
                {uploading ? '⏳ Uploading...' : '📎 Share File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
