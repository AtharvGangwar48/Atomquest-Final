'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { Mic, MicOff, Video, VideoOff, Phone, Send, MessageCircle, X, Copy, Check, Paperclip, FileText, Download } from 'lucide-react';

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

// Fix 2: Use useTracks which correctly handles local + remote tracks with subscription state
function ParticipantGrid() {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  if (tracks.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-white text-lg font-medium">Waiting for participants...</p>
          <p className="text-gray-400 text-sm mt-2">Turn on camera to appear here</p>
        </div>
      </div>
    );
  }

  const gridCols =
    tracks.length === 1 ? 'grid-cols-1' :
    tracks.length <= 4 ? 'grid-cols-2' :
    tracks.length <= 9 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className={`w-full h-full p-2 grid ${gridCols} gap-2 auto-rows-fr`}>
      {tracks.map((trackRef) => (
        <TrackTile key={trackRef.participant.identity} trackRef={trackRef} />
      ))}
    </div>
  );
}

function TrackTile({ trackRef }: { trackRef: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { participant, publication } = trackRef;

  useEffect(() => {
    if (!videoRef.current || !publication?.track) return;
    publication.track.attach(videoRef.current);
    return () => { publication.track?.detach(videoRef.current!); };
  }, [publication?.track]);

  const isCamOff = !publication?.track || publication?.isMuted;

  return (
    <div className="relative w-full h-full bg-gray-800 rounded-xl overflow-hidden">
      {isCamOff ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-2xl font-bold">
                {(participant.name || participant.identity || '?')[0].toUpperCase()}
              </span>
            </div>
            <p className="text-gray-400 text-xs">Camera off</p>
          </div>
        </div>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted={participant.isLocal} className="w-full h-full object-cover" />
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
        <p className="text-white text-sm font-medium">
          {participant.name || participant.identity}{participant.isLocal ? ' (You)' : ''}
        </p>
      </div>
    </div>
  );
}

// Fix 1: Remove the useEffect that force-disables camera on every re-render
function ControlBar({ onEndCall, showChat, setShowChat, onRecord, recording }: any) {
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);

  const toggleMic = useCallback(async () => {
    if (!localParticipant) return;
    const next = !micOn;
    await localParticipant.setMicrophoneEnabled(next);
    setMicOn(next);
  }, [localParticipant, micOn]);

  const toggleCam = useCallback(async () => {
    if (!localParticipant) return;
    const next = !camOn;
    await localParticipant.setCameraEnabled(next);
    setCamOn(next);
  }, [localParticipant, camOn]);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent p-6">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all transform hover:scale-110 ${
            micOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={micOn ? 'Mute' : 'Unmute'}
        >
          {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        <button
          onClick={toggleCam}
          className={`p-4 rounded-full transition-all transform hover:scale-110 ${
            camOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={camOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {camOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all transform hover:scale-110"
          title="Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>

        <button
          onClick={onRecord}
          className={`p-4 rounded-full transition-all transform hover:scale-110 ${
            recording ? 'bg-red-700 hover:bg-red-800 text-white animate-pulse' : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={recording ? 'Stop recording' : 'Start recording'}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            {recording ? '⏹' : '⏺'}
          </div>
        </button>

        <button
          onClick={onEndCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all transform hover:scale-110"
          title="End call"
        >
          <Phone className="w-6 h-6" />
        </button>
      </div>
      <p className="text-center text-gray-400 text-xs mt-3">Press ESC to hide/show controls</p>
    </div>
  );
}

function FilePreview({ msg, isMe }: { msg: Msg; isMe: boolean }) {
  const isImage = msg.mimeType?.startsWith('image/');
  const isVideo = msg.mimeType?.startsWith('video/');
  const isAudio = msg.mimeType?.startsWith('audio/');

  if (isImage) {
    return (
      <a href={msg.fileUrl} target="_blank" rel="noreferrer">
        <img src={msg.fileUrl} alt={msg.content} className="max-w-full rounded-lg max-h-48 object-cover" />
        <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>{msg.content}</p>
      </a>
    );
  }
  if (isVideo) {
    return (
      <div>
        <video src={msg.fileUrl} controls className="max-w-full rounded-lg max-h-40" />
        <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>{msg.content}</p>
      </div>
    );
  }
  if (isAudio) {
    return (
      <div>
        <audio src={msg.fileUrl} controls className="w-full" />
        <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>{msg.content}</p>
      </div>
    );
  }
  return (
    <a
      href={msg.fileUrl}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 hover:underline ${isMe ? 'text-white' : 'text-blue-600'}`}
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="text-sm break-all">{msg.content}</span>
      <Download className="w-4 h-4 shrink-0" />
    </a>
  );
}

function ChatPanel({ messages, newMessage, setNewMessage, sendMessage, onFileUpload, uploading, user, onClose }: any) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-80 h-full bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg">Chat</h3>
          <p className="text-blue-100 text-xs">{messages.length} messages</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-blue-500 rounded-lg transition text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-center text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg: Msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-lg px-4 py-2 ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'}`}>
                  {!isMe && <p className="text-xs font-semibold mb-1 opacity-75">{msg.senderName}</p>}
                  {msg.type === 'file' && msg.fileUrl ? (
                    <FilePreview msg={msg} isMe={isMe} />
                  ) : (
                    <p className="text-sm break-words">{msg.content}</p>
                  )}
                  <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-600'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileUpload(file);
            e.target.value = '';
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition disabled:opacity-50"
            title="Share file"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VideoRoom({ roomData, sessionId, onEndCall }: VideoRoomProps) {
  const user = useAuthStore((s) => s.user);
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlTimeout = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlTimeout.current) clearTimeout(controlTimeout.current);
      controlTimeout.current = setTimeout(() => setShowControls(false), 5000);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowControls((v) => !v);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { sessionId, content: newMessage });
    setNewMessage('');
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const handleEndCall = () => {
    if (recording) stopRecording();
    socketRef.current?.emit('leave_session', { sessionId });
    onEndCall();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
      mr.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${sessionId.substring(0, 8)}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (err: any) {
      alert('Recording failed: ' + err.message);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/chat/${sessionId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Broadcast to other participants via socket
      socketRef.current?.emit('send_file_message', { sessionId, messageId: data.id });
      // Add to local messages immediately
      setMessages((p) => [...p, data]);
    } catch {
      alert('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRecord = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/session/${sessionId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex bg-gray-900 relative overflow-hidden">
      {reconnecting && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-white text-lg font-semibold">Reconnecting...</p>
            <p className="text-gray-400 text-sm mt-2">Attempting to restore connection</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col relative">
        <LiveKitRoom
          video={false}
          audio={false}
          token={roomData.roomToken}
          serverUrl={livekitUrl}
          connectOptions={{ autoSubscribe: true }}
          style={{ height: '100%' }}
        >
          <ParticipantGrid />
          <RoomAudioRenderer />

          {showControls && (
            <ControlBar
              onEndCall={handleEndCall}
              showChat={showChat}
              setShowChat={setShowChat}
              onRecord={handleRecord}
              recording={recording}
            />
          )}

          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">{roomData.roomName}</h2>
              <p className="text-gray-400 text-xs">Room ID: {sessionId.substring(0, 8)}...</p>
            </div>
            <button
              onClick={copyRoomLink}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
            >
              {copied ? (
                <><Check className="w-4 h-4" /><span className="text-sm">Copied!</span></>
              ) : (
                <><Copy className="w-4 h-4" /><span className="text-sm">Share Room</span></>
              )}
            </button>
          </div>
        </LiveKitRoom>
      </div>

      {showChat && (
        <div className="hidden md:block ml-4 mb-4 mt-4 mr-4">
          <ChatPanel
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            onFileUpload={handleFileUpload}
            uploading={uploading}
            user={user}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {showChat && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40 flex items-end">
          <div className="w-full h-96">
            <ChatPanel
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendMessage={sendMessage}
              onFileUpload={handleFileUpload}
              uploading={uploading}
              user={user}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
