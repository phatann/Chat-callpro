import { useState, useEffect, useRef, FormEvent } from 'react';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile, ArrowLeft, Mic, Ban, VolumeX, X, Square, Play, Pause, User as UserIcon, BadgeCheck, Loader2, FileText } from 'lucide-react';
import { User, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import UserProfileModal from './UserProfileModal';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

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
  
  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

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

  const [error, setError] = useState<string | null>(null);

  // Clear local error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    if (!isConnected) {
      setError('Cannot send message: No connection to server');
      return;
    }

    try {
      onSendMessage(newMessage);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleStartCall = (video: boolean) => {
    if (!isConnected) {
      setError('Cannot start call: No connection to server');
      return;
    }
    try {
      onStartCall(video);
    } catch (err) {
      console.error('Failed to start call:', err);
      setError('Failed to start call. Please try again.');
    }
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.url) {
        let type: 'image' | 'video' | 'document' = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        
        onSendMessage(data.url, type);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
            className="bg-yellow-50 text-yellow-700 px-4 py-2 text-sm text-center font-medium z-20 overflow-hidden border-b border-yellow-100"
          >
            Connecting to server...
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error Toast */}
      <AnimatePresence>
        {(wsError || error) && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-20 left-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl z-50 text-sm font-medium flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"/>
            {wsError || error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md px-4 py-3 border-b border-slate-200/60 flex items-center justify-between shadow-sm z-10 relative">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowProfileModal(true)}>
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            <img src={chatUser.avatar_url} alt={chatUser.username} className="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-200 group-hover:border-blue-200 transition-colors" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-slate-800 text-[15px] leading-tight group-hover:text-blue-600 transition-colors">{chatUser.username}</h2>
              {chatUser.verified === 1 && (
                <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white" />
              )}
            </div>
            <p className="text-xs font-medium h-4 flex items-center">
              {isTyping ? (
                <span className="text-blue-500 font-semibold animate-pulse">typing...</span>
              ) : (
                <span className="text-slate-400">Online</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 text-slate-400 relative">
          <button onClick={() => handleStartCall(true)} className="p-2.5 hover:bg-slate-50 rounded-full transition-all hover:text-blue-500 active:scale-95">
            <Video className="w-5 h-5" />
          </button>
          <button onClick={() => handleStartCall(false)} className="p-2.5 hover:bg-slate-50 rounded-full transition-all hover:text-blue-500 active:scale-95">
            <Phone className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2.5 hover:bg-slate-50 rounded-full transition-all hover:text-blue-500 active:scale-95 ${showMenu ? 'bg-slate-50 text-blue-500' : ''}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden ring-1 ring-black/5 origin-top-right"
                >
                  <div className="p-1.5">
                    <button 
                      onClick={() => { setShowProfileModal(true); setShowMenu(false); }}
                      className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      View Profile
                    </button>
                    <button 
                      onClick={toggleBlock}
                      className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Ban className="w-4 h-4 text-slate-400" />
                      {isBlocked ? 'Unblock User' : 'Block User'}
                    </button>
                    <button className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3 text-slate-700 rounded-lg transition-colors text-sm font-medium">
                      <VolumeX className="w-4 h-4 text-slate-400" />
                      Mute Notifications
                    </button>
                  </div>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat scroll-smooth">
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <motion.div 
              key={msg.id} 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] md:max-w-[65%] rounded-2xl px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.08)] relative text-[15px] ${
                  isMe 
                    ? 'bg-[#dcf8c6] rounded-tr-none text-slate-900 border border-green-100' 
                    : 'bg-white rounded-tl-none text-slate-900 border border-white'
                }`}
              >
                {msg.type === 'audio' ? (
                  <div className="flex items-center gap-2 min-w-[180px] py-1">
                    <audio src={msg.content} controls className="h-8 w-full max-w-[240px]" />
                  </div>
                ) : msg.type === 'image' ? (
                  <div className="max-w-[280px] rounded-lg overflow-hidden my-1">
                    <img 
                      src={msg.content} 
                      alt="Shared image" 
                      className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-300 cursor-pointer" 
                      loading="lazy" 
                      onClick={() => setSelectedImage(msg.content)}
                    />
                  </div>
                ) : msg.type === 'video' ? (
                  <div className="max-w-[280px] rounded-lg overflow-hidden my-1 bg-black">
                    <video src={msg.content} controls className="w-full h-auto" />
                  </div>
                ) : msg.type === 'document' ? (
                  <a 
                    href={msg.content} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl hover:bg-slate-100 transition-colors min-w-[220px] border border-slate-100 group"
                  >
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold truncate text-slate-700">Document</p>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Download</p>
                    </div>
                  </a>
                ) : (
                  <p className="leading-relaxed px-1 pt-1">{msg.content}</p>
                )}
                <div className={`text-[10px] text-right mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-green-800/60' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && <span className="font-bold text-[10px]">✓✓</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#f0f2f5] px-4 py-3 pb-safe flex items-end gap-2 border-t border-slate-200 relative">
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-full left-4 mb-2 z-50 shadow-xl rounded-2xl overflow-hidden"
            >
              <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
            </motion.div>
          )}
        </AnimatePresence>

        {isBlocked ? (
          <div className="w-full p-4 bg-slate-100 text-slate-500 text-center rounded-xl text-sm font-medium border border-slate-200">
            You blocked this contact. <button onClick={toggleBlock} className="text-blue-500 hover:underline">Tap to unblock.</button>
          </div>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: '100%' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 bg-white rounded-2xl flex items-center px-4 py-3 shadow-sm border border-red-100 gap-3"
                >
                  <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                  <span className="flex-1 font-mono text-slate-700 font-medium">{formatTime(recordingTime)}</span>
                  <button onClick={cancelRecording} className="text-slate-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ) : (
                <div className="flex-1 bg-white rounded-2xl flex items-center px-2 py-1.5 shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/30 transition-all">
                  <button 
                    className={`p-2.5 transition-colors rounded-full hover:bg-slate-50 ${showEmojiPicker ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-blue-500'}`}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="w-6 h-6" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message"
                    className="flex-1 py-2 px-2 border-none focus:outline-none bg-transparent text-slate-900 placeholder:text-slate-400 text-[15px]"
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                  />
                  {newMessage.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium px-1 tabular-nums">
                      {newMessage.length}
                    </span>
                  )}
                  <button 
                    className="p-2.5 text-slate-400 hover:text-blue-500 transition-colors -rotate-45 rounded-full hover:bg-slate-50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <Paperclip className="w-5 h-5" />}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect}
                  />
                </div>
              )}
            </AnimatePresence>
            
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={isRecording ? stopRecording : (newMessage.trim() ? handleSend : startRecording)}
              className={`p-3.5 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                  : newMessage.trim() 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/30' 
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

      {/* Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage} 
              alt="Full size" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
