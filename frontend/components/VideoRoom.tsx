'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api'
import { Mic, MicOff, Video, VideoOff, Phone, Send, MessageCircle, X, Copy, Check } from 'lucide-react';

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

function VideoDisplay({ participantIdentity, participantName }: { participantIdentity: string; participantName: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const participants = useParticipants();

  useEffect(() => {
    const participant = participants.find((p) => p.identity === participantIdentity);
    if (!participant || !videoRef.current) return;

    const subs = participant.videoTrackPublications;
    if (!subs || subs.size === 0) return;

    const pub = Array.from(subs.values())[0];
    if (!pub || !pub.isSubscribed) return;

    const videoTrack = pub.track;
    if (!videoTrack) return;

    videoTrack.attach(videoRef.current);
    return () => {
      videoTrack.detach();
    };
  }, [participantIdentity, participants]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
        <p className="text-white text-sm font-medium">{participantName}</p>
      </div>
    </div>
  );
}

function ParticipantGrid() {
  const participants = useParticipants();

  if (!participants || participants.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-white text-lg font-medium">Waiting for participants...</p>
          <p className="text-gray-400 text-sm mt-2">Your video will show here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-2">
      {participants.length === 1 ? (
        <div className="w-full h-full">
          <VideoDisplay 
            participantIdentity={participants[0].identity}
            participantName={participants[0].name || participants[0].identity}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2 h-full auto-rows-fr">
          {participants.map((p) => (
            <VideoDisplay 
              key={p.identity}
              participantIdentity={p.identity}
              participantName={p.name || p.identity}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ControlBar({ onEndCall, socket, sessionId, showChat, setShowChat, onRecord, recording }: any) {
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);

  useEffect(() => {
    if (localParticipant) {
      localParticipant.setCameraEnabled(false).catch(console.error);
    }
  }, [localParticipant]);

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
        {/* Microphone */}
        <button
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all transform hover:scale-110 ${
            micOn
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={micOn ? 'Mute (Ctrl+M)' : 'Unmute'}
        >
          {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        {/* Camera */}
        <button
          onClick={toggleCam}
          className={`p-4 rounded-full transition-all transform hover:scale-110 ${
            camOn
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={camOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {camOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        {/* Chat */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all transform hover:scale-110"
          title="Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>

        {/* Record */}
        <button
          onClick={onRecord}
          className={`p-4 rounded-full transition-all transform hover:scale-110 ${
            recording
              ? 'bg-red-700 hover:bg-red-800 text-white animate-pulse'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={recording ? 'Stop recording' : 'Start recording'}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            {recording ? '⏹' : '⏺'}
          </div>
        </button>

        {/* End Call */}
        <button
          onClick={onEndCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all transform hover:scale-110"
          title="End call (Ctrl+Q)"
        >
          <Phone className="w-6 h-6" />
        </button>
      </div>
      <p className="text-center text-gray-400 text-xs mt-3">Press ESC to hide/show controls</p>
    </div>
  );
}

function ChatPanel({ messages, newMessage, setNewMessage, sendMessage, user, onClose }: any) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-80 h-full bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg">Chat</h3>
          <p className="text-blue-100 text-xs">{messages.length} messages</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-blue-500 rounded-lg transition text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-center text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs rounded-lg px-4 py-2 ${
                    isMe
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {!isMe && <p className="text-xs font-semibold mb-1 opacity-75">{msg.senderName}</p>}
                  <p className="text-sm break-words">{msg.content}</p>
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

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
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
  const [recording, setRecording] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlTimeout = useRef<NodeJS.Timeout>();

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
      controlTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowControls(!showControls);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showControls]);

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
        console.error('Stop recording error:', err);
      }
    }
    socketRef.current?.emit('leave_session', { sessionId });
    onEndCall();
  };

  const startRecording = async () => {
    try {
      const { data } = await api.post('/recordings/start', { sessionId });
      setRecording(data);
    } catch (err: any) {
      alert('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await api.post(`/recordings/${recording.id}/stop`);
      setRecording(null);
    } catch (err: any) {
      alert('Failed to stop recording');
    }
  };

  const handleRecord = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex bg-gray-900 relative overflow-hidden">
      {/* Reconnecting Indicator */}
      {reconnecting && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-white text-lg font-semibold">Reconnecting...</p>
            <p className="text-gray-400 text-sm mt-2">Attempting to restore connection</p>
          </div>
        </div>
      )}

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col relative">
        <LiveKitRoom
          video={true}
          audio={true}
          token={roomData.roomToken}
          serverUrl={livekitUrl}
          connectOptions={{ autoSubscribe: true }}
          style={{ height: '100%' }}
        >
          <ParticipantGrid />
          <RoomAudioRenderer />
          
          {/* Controls - Show/Hide on mouse movement */}
          {showControls && (
            <ControlBar 
              onEndCall={handleEndCall}
              socket={socketRef.current}
              sessionId={sessionId}
              showChat={showChat}
              setShowChat={setShowChat}
              onRecord={handleRecord}
              recording={recording}
            />
          )}

          {/* Top Bar - Room Info */}
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
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Share Room</span>
                </>
              )}
            </button>
          </div>
        </LiveKitRoom>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="hidden md:block ml-4 mb-4 mt-4 mr-4">
          <ChatPanel
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            user={user}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {/* Mobile Chat Modal */}
      {showChat && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40 flex items-end">
          <div className="w-full h-96">
            <ChatPanel
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendMessage={sendMessage}
              user={user}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
