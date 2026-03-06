import { useState, useEffect, useRef, FormEvent } from 'react';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile, ArrowLeft, Mic, Ban, VolumeX, X, Square, Play, Pause, User as UserIcon, BadgeCheck } from 'lucide-react';
import { User, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileModal from './UserProfileModal';

interface ChatWindowProps {
  chatUser: User;
  messages: Message[];
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video' | 'audio') => void;
  onStartCall: (video: boolean) => void;
  onBack: () => void;
  isConnected: boolean;
  wsError: string | null;
  onClearError: () => void;
  isTyping: boolean;
  onTyping: () => void;
}

export default function ChatWindow({ chatUser, messages, onSendMessage, onStartCall, onBack, isConnected, wsError, onClearError, isTyping, onTyping }: ChatWindowProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Check if user is blocked
    fetch('/api/users/me/blocked')
      .then(res => res.json())
      .then(data => {
        if (data.blocked && Array.isArray(data.blocked)) {
          const blockedIds = data.blocked.map((b: any) => b.blocked_user_id);
          setIsBlocked(blockedIds.includes(chatUser.id));
        } else {
          setIsBlocked(false);
        }
      })
      .catch(err => {
        console.error('Error fetching blocked users:', err);
        setIsBlocked(false);
      });
  }, [chatUser.id]);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (wsError) {
      const timer = setTimeout(() => {
        onClearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [wsError, onClearError]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Throttle typing events
    if (!typingTimeoutRef.current) {
      onTyping();
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const toggleBlock = async () => {
    if (isBlocked) {
      await fetch(`/api/users/${chatUser.id}/unblock`, { method: 'POST' });
      setIsBlocked(false);
    } else {
      await fetch(`/api/users/${chatUser.id}/block`, { method: 'POST' });
      setIsBlocked(true);
    }
    setShowMenu(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSendMessage(base64Audio, 'audio');
        };
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop but don't send
      mediaRecorderRef.current.onstop = null; // Remove handler to prevent sending
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative overflow-hidden">
      {/* Connection Status Banner */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm text-center font-medium z-20 overflow-hidden"
          >
            Connecting...
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error Toast */}
      <AnimatePresence>
        {wsError && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-20 left-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm font-medium"
          >
            {wsError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white p-2 md:px-4 md:py-3 border-b border-slate-200 flex items-center justify-between shadow-sm z-10 relative">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowProfileModal(true)}>
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="relative">
            <img src={chatUser.avatar_url} alt={chatUser.username} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1">
              <h2 className="font-semibold text-slate-800 text-base leading-tight">{chatUser.username}</h2>
              {chatUser.verified === 1 && (
                <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500 text-white" />
              )}
            </div>
            <p className="text-xs font-medium h-4 flex items-center">
              {isTyping ? (
                <span className="text-blue-500 animate-pulse">typing...</span>
              ) : (
                <span className="text-slate-500">Online</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 text-slate-500 relative">
          <button onClick={() => onStartCall(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-blue-500">
            <Video className="w-5 h-5" />
          </button>
          <button onClick={() => onStartCall(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-blue-500">
            <Phone className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden"
                >
                  <button 
                    onClick={() => { setShowProfileModal(true); setShowMenu(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                  >
                    <UserIcon className="w-4 h-4" />
                    View Profile
                  </button>
                  <button 
                    onClick={toggleBlock}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                  >
                    <Ban className="w-4 h-4" />
                    {isBlocked ? 'Unblock User' : 'Block User'}
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700">
                    <VolumeX className="w-4 h-4" />
                    Mute Notifications
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <UserProfileModal user={chatUser} onClose={() => setShowProfileModal(false)} />
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#efeae2] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] md:max-w-[65%] rounded-2xl px-4 py-2 shadow-sm relative text-[15px] ${
                  isMe ? 'bg-[#dcf8c6] rounded-tr-none text-slate-900' : 'bg-white rounded-tl-none text-slate-900'
                }`}
              >
                {msg.type === 'audio' ? (
                  <div className="flex items-center gap-2 min-w-[150px]">
                    <audio src={msg.content} controls className="h-8 w-full max-w-[200px]" />
                  </div>
                ) : (
                  <p className="leading-relaxed pb-1">{msg.content}</p>
                )}
                <div className={`text-[10px] text-right ${isMe ? 'text-green-800/60' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && <span className="ml-1">✓✓</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#f0f2f5] px-4 py-3 pb-safe flex items-end gap-2">
        {isBlocked ? (
          <div className="w-full p-3 bg-slate-100 text-slate-500 text-center rounded-lg text-sm">
            You blocked this contact. Tap to unblock.
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: '100%' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 bg-white rounded-2xl flex items-center px-4 py-2 shadow-sm border border-red-200 gap-3"
                >
                  <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full" />
                  <span className="flex-1 font-mono text-slate-700">{formatTime(recordingTime)}</span>
                  <button onClick={cancelRecording} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ) : (
                <div className="flex-1 bg-white rounded-2xl flex items-center px-2 py-1 shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <Smile className="w-6 h-6" />
                  </button>
                  <input
                    type="text"
                    placeholder="Message"
                    className="flex-1 py-2 px-2 border-none focus:outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors -rotate-45">
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>
              )}
            </AnimatePresence>
            
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={isRecording ? stopRecording : (newMessage.trim() ? handleSend : startRecording)}
              className={`p-3 rounded-full shadow-md flex items-center justify-center transition-colors ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : newMessage.trim() 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
              }`}
            >
              {isRecording ? (
                <Send className="w-5 h-5 ml-0.5" />
              ) : newMessage.trim() ? (
                <Send className="w-5 h-5 ml-0.5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
