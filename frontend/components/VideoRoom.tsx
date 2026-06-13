'use client';

import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';

interface VideoRoomProps {
  roomData: {
    roomToken: string;
    roomName: string;
    wsUrl: string;
    sessionId: string;
  };
  sessionId: string;
  onEndCall: () => void;
}

export default function VideoRoom({ roomData, sessionId, onEndCall }: VideoRoomProps) {
  const user = useAuthStore((s) => s.user);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [recording, setRecording] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:3001', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_session', { sessionId });
    });

    newSocket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(newSocket);

    loadMessages();

    return () => {
      newSocket.close();
    };
  }, [sessionId]);

  const loadMessages = async () => {
    try {
      const { data } = await api.get(`/chat/${sessionId}/messages`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;
    socket.emit('send_message', { sessionId, content: newMessage });
    setNewMessage('');
  };

  const startRecording = async () => {
    try {
      const { data } = await api.post('/recordings/start', { sessionId });
      setRecording(data);
    } catch (err) {
      alert('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await api.post(`/recordings/${recording.id}/stop`);
      setRecording(null);
      alert('Recording stopped and processing');
    } catch (err) {
      alert('Failed to stop recording');
    }
  };

  return (
    <div className="h-screen flex bg-gray-900">
      <div className={`flex-1 ${showChat ? 'mr-80' : ''}`}>
        <LiveKitRoom
          video={true}
          audio={true}
          token={roomData.roomToken}
          serverUrl={roomData.wsUrl}
          data-lk-theme="default"
          style={{ height: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
          
          <div className="absolute bottom-4 left-4 flex gap-2">
            <button
              onClick={onEndCall}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium"
            >
              End Call
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
            >
              {showChat ? 'Hide' : 'Show'} Chat
            </button>
            {!recording ? (
              <button
                onClick={startRecording}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 animate-pulse"
              >
                Stop Recording
              </button>
            )}
          </div>
        </LiveKitRoom>
      </div>

      {showChat && (
        <div className="w-80 bg-gray-800 flex flex-col">
          <div className="p-4 bg-gray-900 border-b border-gray-700">
            <h3 className="text-white font-semibold">Chat</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.senderId === user?.id ? 'bg-blue-600 ml-8' : 'bg-gray-700 mr-8'
                }`}
              >
                <p className="text-white text-sm">{msg.content}</p>
                <p className="text-xs text-gray-300 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-900 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
