import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import CallModal from '../components/CallModal';
import ProfilePage from './ProfilePage';
import AdminDashboard from './AdminDashboard';
import ContactsPage from './ContactsPage';
import AuthPage from './AuthPage';
import { User, Message } from '../types';
import { requestNotificationPermission, sendNotification, playNotificationSound } from '../utils/notifications';

export default function Dashboard() {
  const { user, loading } = useAuth();
  
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
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
      // If message is from someone else
      if (msg.sender_id !== user?.id) {
        const isBackground = document.hidden || selectedChatUser?.id !== msg.sender_id;

        if (isBackground) {
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
        } else {
          // Play sound if in foreground and in chat (since sendNotification plays it otherwise)
          playNotificationSound();
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
      } else {
        // Play sound if in foreground
        playNotificationSound();
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
          if (data && Array.isArray(data.messages)) {
            setMessages(data.messages);
          } else {
            setMessages([]);
          }
          markAsRead(selectedChatUser.id);
        })
        .catch(err => {
          console.error('Error fetching messages:', err);
          setMessages([]);
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
      <div className={`h-full flex-col bg-white border-r border-slate-200 ${selectedChatUser || showProfile || showAdmin || showContacts ? 'hidden md:flex w-full md:w-[30%] min-w-[300px] max-w-[400px]' : 'flex w-full md:w-[30%] md:min-w-[300px] md:max-w-[400px]'}`}>
        <Sidebar 
          onSelectChat={(user) => {
            setSelectedChatUser(user);
            setShowProfile(false);
            setShowAdmin(false);
            setShowContacts(false);
          }} 
          selectedChatId={selectedChatUser?.id} 
          onProfileClick={() => {
            setShowProfile(true);
            setShowAdmin(false);
            setSelectedChatUser(null);
            setShowContacts(false);
          }}
          onAdminClick={() => {
            setShowAdmin(true);
            setShowProfile(false);
            setSelectedChatUser(null);
            setShowContacts(false);
          }}
          onContactsClick={() => {
            setShowContacts(true);
            setShowProfile(false);
            setShowAdmin(false);
            setSelectedChatUser(null);
          }}
          onSettingsClick={() => {
            setShowProfile(true);
            setShowAdmin(false);
            setSelectedChatUser(null);
            setShowContacts(false);
          }}
        />
      </div>
      
      <div className={`flex-1 flex-col h-full bg-[#efeae2] ${selectedChatUser || showProfile || showAdmin || showContacts ? 'flex' : 'hidden md:flex'}`}>
        {showAdmin && user.role === 'admin' ? (
          <AdminDashboard onBack={() => setShowAdmin(false)} />
        ) : showProfile ? (
          <ProfilePage onBack={() => setShowProfile(false)} />
        ) : showContacts ? (
          <ContactsPage 
            onBack={() => setShowContacts(false)} 
            onSelectUser={(user) => {
              setSelectedChatUser(user);
              setShowContacts(false);
            }} 
          />
        ) : selectedChatUser ? (
          <ChatWindow 
            chatUser={selectedChatUser} 
            messages={messages} 
            onSendMessage={(content, type = 'text') => {
              const sent = ws.sendMessage(selectedChatUser.id, content, type);
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
          <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] border-l border-slate-200 text-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-400 via-transparent to-transparent" />
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-xl mb-8 relative z-10 animate-fade-in-up">
              <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-6 transition-transform duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">Alpha 3.1</h2>
            <p className="text-slate-500 max-w-md leading-relaxed text-lg mb-8">
              Experience the future of team communication.<br/>
              Fast, secure, and designed for professionals.
            </p>
            
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-slate-100 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              End-to-end encrypted
            </div>
            
            <div className="absolute bottom-8 text-slate-300 text-xs">
              Press <kbd className="px-2 py-1 bg-slate-200 rounded text-slate-500 font-mono mx-1">⌘ K</kbd> to search
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
