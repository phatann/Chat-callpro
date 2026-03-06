import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import CallModal from '../components/CallModal';
import ProfilePage from './ProfilePage';
import AdminDashboard from './AdminDashboard';
import AuthPage from './AuthPage';
import { User, Message } from '../types';
import { requestNotificationPermission, sendNotification } from '../utils/notifications';

export default function Dashboard() {
  const { user, loading } = useAuth();
  
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCallUser, setIncomingCallUser] = useState<User | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const ws = useWebSocket(user?.id, {
    onMessage: async (msg) => {
      // If message is from someone else AND (window is hidden OR not in this chat)
      if (msg.sender_id !== user?.id && (document.hidden || selectedChatUser?.id !== msg.sender_id)) {
        try {
          // Try to get username from existing chats if possible to save a fetch, 
          // but fetching is safer for correct name
          const res = await fetch(`/api/users/${msg.sender_id}`);
          if (res.ok) {
            const data = await res.json();
            const senderName = data.user.username;
            sendNotification(`New message from ${senderName}`, {
              body: msg.type === 'image' ? 'Sent an image' : msg.content,
              icon: data.user.avatar_url
            });
          }
        } catch (e) {
          sendNotification('New Message', { body: msg.content });
        }
      }
    },
    onIncomingCall: async (call) => {
      if (document.hidden) {
        try {
          const res = await fetch(`/api/users/${call.senderId}`);
          if (res.ok) {
            const data = await res.json();
            const senderName = data.user.username;
            sendNotification(`Incoming Call from ${senderName}`, {
              body: 'Click to answer',
              requireInteraction: true,
              icon: data.user.avatar_url
            });
          }
        } catch (e) {
          sendNotification('Incoming Call', { body: 'Click to answer' });
        }
      }
    }
  });
  
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

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;
  if (!user) return <AuthPage />;

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden relative">
      <div className={`h-full flex-col bg-white border-r border-slate-200 ${selectedChatUser ? 'hidden md:flex w-full md:w-[30%] min-w-[300px] max-w-[400px]' : 'flex w-full md:w-[30%] md:min-w-[300px] md:max-w-[400px]'}`}>
        <Sidebar 
          onSelectChat={(user) => {
            setSelectedChatUser(user);
            setShowProfile(false);
            setShowAdmin(false);
          }} 
          selectedChatId={selectedChatUser?.id} 
          onProfileClick={() => {
            setShowProfile(true);
            setShowAdmin(false);
            setSelectedChatUser(null);
          }}
          onAdminClick={() => {
            setShowAdmin(true);
            setShowProfile(false);
            setSelectedChatUser(null);
          }}
        />
      </div>
      
      <div className={`flex-1 flex-col h-full bg-[#efeae2] ${selectedChatUser || showProfile || showAdmin ? 'flex' : 'hidden md:flex'}`}>
        {showAdmin && user.role === 'admin' ? (
          <AdminDashboard onBack={() => setShowAdmin(false)} />
        ) : showProfile ? (
          <ProfilePage onBack={() => setShowProfile(false)} />
        ) : selectedChatUser ? (
          <ChatWindow 
            chatUser={selectedChatUser} 
            messages={messages} 
            onSendMessage={(content) => {
              const sent = ws.sendMessage(selectedChatUser.id, content);
              if (!sent) {
                // Error is handled in useWebSocket and passed to ChatWindow via props if needed, 
                // or we can just let ChatWindow display the error state from ws.error
              }
            }}
            onStartCall={(video) => {
              setIsInCall(true);
              setIsVideoCall(video);
            }}
            onBack={() => setSelectedChatUser(null)}
            isConnected={ws.isConnected}
            wsError={ws.error}
            onClearError={() => ws.setError(null)}
            isTyping={ws.typingUsers.has(selectedChatUser.id)}
            onTyping={() => ws.sendTyping(selectedChatUser.id)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] border-l border-slate-200 text-center p-8">
            <div className="bg-slate-100 p-6 rounded-full mb-6">
              <img src="/vite.svg" className="w-20 h-20 opacity-50 grayscale" alt="Logo" />
            </div>
            <h2 className="text-3xl font-light text-slate-700 mb-4">Alpha 3.1</h2>
            <p className="text-slate-500 max-w-md leading-relaxed">
              Send and receive messages without keeping your phone online.<br/>
              Use Alpha on up to 4 linked devices and 1 phone.
            </p>
            <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
              <span className="w-3 h-3 bg-slate-300 rounded-full"></span>
              End-to-end encrypted
            </div>
          </div>
        )}
      </div>

      {isInCall && (selectedChatUser || incomingCallUser) && (
        <CallModal 
          currentUser={user}
          targetUser={incomingCallUser || selectedChatUser!}
          isVideo={isVideoCall}
          isIncoming={!!incomingCallUser}
          onClose={() => {
            const targetId = incomingCallUser?.id || selectedChatUser?.id;
            if (targetId) {
              ws.endCall(targetId);
            }
            setIsInCall(false);
            setIncomingCallUser(null);
          }}
          ws={ws}
        />
      )}
    </div>
  );
}
