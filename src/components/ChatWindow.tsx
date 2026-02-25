import { useState, useEffect, useRef, FormEvent } from 'react';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { User, Message } from '../types';
import { useAuth } from '../context/AuthContext';

interface ChatWindowProps {
  chatUser: User;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onStartCall: (video: boolean) => void;
}

export default function ChatWindow({ chatUser, messages, onSendMessage, onStartCall }: ChatWindowProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#efeae2]">
      {/* Header */}
      <div className="bg-white p-3 border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <img src={chatUser.avatar_url} alt={chatUser.username} className="w-10 h-10 rounded-full bg-slate-200" />
          <div>
            <h2 className="font-semibold text-slate-800">{chatUser.username}</h2>
            <p className="text-xs text-teal-600">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-teal-600">
          <button onClick={() => onStartCall(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button onClick={() => onStartCall(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[70%] rounded-lg p-3 shadow-sm relative ${
                  isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'
                }`}
              >
                <p className="text-slate-800 text-sm leading-relaxed">{msg.content}</p>
                <span className="text-[10px] text-slate-500 block text-right mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#f0f2f5] p-3 flex items-center gap-2">
        <button className="p-2 text-slate-500 hover:text-slate-600">
          <Smile className="w-6 h-6" />
        </button>
        <button className="p-2 text-slate-500 hover:text-slate-600">
          <Paperclip className="w-6 h-6" />
        </button>
        <form onSubmit={handleSend} className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Type a message"
            className="flex-1 py-2 px-4 rounded-lg border-none focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit" 
            className={`p-2 rounded-full transition-colors ${newMessage.trim() ? 'bg-teal-600 text-white hover:bg-teal-700' : 'text-slate-400 bg-transparent'}`}
            disabled={!newMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
