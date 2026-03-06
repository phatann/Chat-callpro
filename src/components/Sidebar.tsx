import { useState, useEffect } from 'react';
import { Search, Menu, Shield, X, Check, CheckCheck } from 'lucide-react';
import { Chat, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  onSelectChat: (user: User) => void;
  selectedChatId?: string;
  onProfileClick: () => void;
  onAdminClick?: () => void;
}

export default function Sidebar({ onSelectChat, selectedChatId, onProfileClick, onAdminClick }: SidebarProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchChats = () => {
    fetch('/api/chats')
      .then(res => res.json())
      .then(data => setChats(data.chats));
  };

  useEffect(() => {
    fetchChats();
    window.addEventListener('chats_updated', fetchChats);
    return () => window.removeEventListener('chats_updated', fetchChats);
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      fetch(`/api/users/search?q=${searchQuery}`)
        .then(res => res.json())
        .then(data => setSearchResults(data.users));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 bg-[#f0f2f5] shrink-0 border-b border-slate-200">
        <button 
          onClick={onProfileClick}
          className="relative group"
        >
          <img 
            src={user?.avatar_url} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover border border-slate-300 group-hover:opacity-90 transition-opacity"
          />
        </button>
        
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <button 
              onClick={onAdminClick}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
              title="Admin Dashboard"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Search */}
      <div className="px-3 py-2 bg-white border-b border-slate-100 shrink-0">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <motion.div
              animate={{ rotate: isSearching ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
              ) : (
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              )}
            </motion.div>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border-none rounded-lg leading-5 bg-[#f0f2f5] text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500/50 focus:shadow-sm transition-all text-sm"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-4 py-2 text-xs font-semibold text-blue-500 uppercase tracking-wider bg-slate-50">
                Global Search Results
              </div>
              {searchResults.map((result, index) => (
                <motion.div 
                  key={result.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => {
                    onSelectChat(result);
                    setSearchQuery('');
                    setIsSearching(false);
                  }}
                  className="flex items-center px-3 py-3 hover:bg-[#f5f6f6] cursor-pointer transition-colors border-b border-slate-50"
                >
                  <img src={result.avatar_url} alt={result.username} className="w-12 h-12 rounded-full object-cover mr-3 bg-slate-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-medium truncate text-[15px]">{result.username}</p>
                    {user?.role === 'admin' && (
                      <p className="text-slate-500 text-xs truncate">{result.email || result.phone}</p>
                    )}
                    <p className="text-slate-400 text-xs truncate mt-0.5">
                      {result.status || "Hey there! I am using Alpha."}
                    </p>
                  </div>
                </motion.div>
              ))}
              {searchResults.length === 0 && searchQuery && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Search className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm">No users found</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chat-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {chats.map((chat, index) => (
                <motion.div 
                  key={chat.id}
                  layoutId={`chat-${chat.id}`}
                  onClick={() => onSelectChat({ 
                    id: chat.id, 
                    username: chat.username, 
                    avatar_url: chat.avatar_url, 
                    email: null, 
                    phone: null 
                  })}
                  className={`flex items-center px-3 py-3 hover:bg-[#f5f6f6] cursor-pointer transition-colors group border-b border-slate-50 ${selectedChatId === chat.id ? 'bg-[#f0f2f5]' : ''}`}
                >
                  <div className="relative">
                    <img src={chat.avatar_url} alt={chat.username} className="w-12 h-12 rounded-full object-cover mr-3 bg-slate-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-medium truncate text-slate-900 text-[16px]">{chat.username}</h3>
                      <span className={`text-xs whitespace-nowrap ml-2 ${chat.unread_count > 0 ? 'text-green-500 font-medium' : 'text-slate-400'}`}>
                        {new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-slate-500 text-sm truncate pr-2 max-w-[85%]">
                        {chat.last_message_sender === user?.id && (
                          <span className="mr-1 text-blue-500">
                            <CheckCheck className="w-4 h-4" />
                          </span>
                        )}
                        <span className="truncate">{chat.last_message}</span>
                      </div>
                      {chat.unread_count > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm"
                        >
                          {chat.unread_count}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
