import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import CallModal from '../components/CallModal';
import ProfilePage from './ProfilePage';
import AuthPage from './AuthPage';
import { User, Message } from '../types';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const ws = useWebSocket(user?.id);
  
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCallUser, setIncomingCallUser] = useState<User | null>(null);

  const markAsRead = async (otherUserId: string) => {
    await fetch(`/api/messages/${otherUserId}/read`, { method: 'POST' });
    window.dispatchEvent(new CustomEvent('chats_updated'));
  };

  useEffect(() => {
    if (selectedChatUser) {
      fetch(`/api/messages/${selectedChatUser.id}`)
        .then(res => res.json())
        .then(data => {
          setMessages(data.messages);
          markAsRead(selectedChatUser.id);
        });
    }
  }, [selectedChatUser]);

  useEffect(() => {
    if (ws.messages.length > 0) {
      const lastMsg = ws.messages[ws.messages.length - 1];
      if (selectedChatUser && (lastMsg.sender_id === selectedChatUser.id || lastMsg.receiver_id === selectedChatUser.id)) {
        setMessages(prev => [...prev, lastMsg]);
        if (lastMsg.sender_id === selectedChatUser.id) {
          markAsRead(selectedChatUser.id);
        }
      } else {
        window.dispatchEvent(new CustomEvent('chats_updated'));
      }
    }
  }, [ws.messages]);

  useEffect(() => {
    if (ws.incomingCall && !isInCall) {
      // Fetch real user details
      fetch(`/api/users/${ws.incomingCall.senderId}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('User not found');
        })
        .then(data => {
          setIncomingCallUser(data.user);
          setIsInCall(true);
          setIsVideoCall(true);
        })
        .catch(() => {
          // Fallback if fetch fails
          setIncomingCallUser({
            id: ws.incomingCall!.senderId,
            username: 'Unknown Caller',
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${ws.incomingCall!.senderId}`,
            email: null,
            phone: null
          });
          setIsInCall(true);
          setIsVideoCall(true);
        });
    }
  }, [ws.incomingCall, isInCall]);

  useEffect(() => {
    const handleCallEnded = () => {
      setIsInCall(false);
      setIncomingCallUser(null);
    };
    window.addEventListener('call_ended', handleCallEnded);
    return () => window.removeEventListener('call_ended', handleCallEnded);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <AuthPage />;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar 
        onSelectChat={(user) => {
          setSelectedChatUser(user);
          setShowProfile(false);
        }} 
        selectedChatId={selectedChatUser?.id} 
        onProfileClick={() => {
          setShowProfile(true);
          setSelectedChatUser(null);
        }}
      />
      
      {showProfile ? (
        <ProfilePage onBack={() => setShowProfile(false)} />
      ) : selectedChatUser ? (
        <ChatWindow 
          chatUser={selectedChatUser} 
          messages={messages} 
          onSendMessage={(content) => ws.sendMessage(selectedChatUser.id, content)}
          onStartCall={(video) => {
            setIsInCall(true);
            setIsVideoCall(video);
          }}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#f0f2f5] border-l border-slate-200">
          <div className="text-center">
            <h2 className="text-2xl font-light text-slate-600 mb-2">Welcome to Chat & Call Pro</h2>
            <p className="text-slate-500">Select a chat to start messaging</p>
          </div>
        </div>
      )}

      {isInCall && (selectedChatUser || incomingCallUser) && (
        <CallModal 
          currentUser={user}
          targetUser={incomingCallUser || selectedChatUser!}
          isVideo={isVideoCall}
          isIncoming={!!incomingCallUser}
          onClose={() => {
            setIsInCall(false);
            setIncomingCallUser(null);
          }}
          ws={ws}
        />
      )}
    </div>
  );
}
