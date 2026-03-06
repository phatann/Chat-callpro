import { useState, useEffect } from 'react';
import { Search, Menu, Shield, X, Check, CheckCheck, Settings, Bell, Moon, Sun, LogOut, Users, BadgeCheck } from 'lucide-react';
import { Chat, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  onSelectChat: (user: User) => void;
  selectedChatId?: string;
  onProfileClick: () => void;
  onAdminClick?: () => void;
  onContactsClick: () => void;
  onSettingsClick: () => void;
}

export default function Sidebar({ onSelectChat, selectedChatId, onProfileClick, onAdminClick, onContactsClick, onSettingsClick }: SidebarProps) {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load preferences
    const storedNotifs = localStorage.getItem('notificationsEnabled');
    if (storedNotifs !== null) setNotificationsEnabled(JSON.parse(storedNotifs));

    const storedTheme = localStorage.getItem('darkMode');
    if (storedTheme !== null) {
      setDarkMode(JSON.parse(storedTheme));
      if (JSON.parse(storedTheme)) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notificationsEnabled', JSON.stringify(newValue));
  };

  const toggleTheme = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', JSON.stringify(newValue));
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const fetchChats = () => {
    fetch('/api/chats')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.chats)) {
          setChats(data.chats);
        } else {
          setChats([]);
        }
      })
      .catch(err => {
        console.error('Error fetching chats:', err);
        setChats([]);
      });
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
        .then(data => {
          if (data && Array.isArray(data.users)) {
            setSearchResults(data.users);
          } else {
            setSearchResults([]);
          }
        })
        .catch(err => {
          console.error('Error searching users:', err);
          setSearchResults([]);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-slate-200 relative">
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
        
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={onContactsClick}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
            title="Contacts"
          >
            <Users className="w-5 h-5" />
          </button>
          {user?.role === 'admin' && (
            <button 
              onClick={onAdminClick}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
              title="Admin Dashboard"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors ${showSettings ? 'bg-slate-200' : ''}`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Settings Menu */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden origin-top-right"
              >
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Settings</h3>
                  <p className="text-xs text-slate-500">{user?.email || user?.phone}</p>
                </div>
                
                <div className="py-2">
                  <button 
                    onClick={() => {
                      onSettingsClick();
                      setShowSettings(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>

                  <button 
                    onClick={toggleNotifications}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-slate-700">
                      <Bell className="w-4 h-4" />
                      <span className="text-sm">Notifications</span>
                    </div>
                    <div className={`w-9 h-5 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-5' : 'left-1'}`} />
                    </div>
                  </button>

                  <button 
                    onClick={toggleTheme}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-slate-700">
                      {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      <span className="text-sm">Dark Mode</span>
                    </div>
                    <div className={`w-9 h-5 rounded-full relative transition-colors ${darkMode ? 'bg-blue-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${darkMode ? 'left-5' : 'left-1'}`} />
                    </div>
                  </button>

                  <div className="h-px bg-slate-100 my-1" />

                  <button 
                    onClick={logout}
                    className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Log Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                    <div className="flex items-center gap-1">
                      <p className="text-slate-900 font-medium truncate text-[15px]">{result.username}</p>
                      {result.verified === 1 && (
                        <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500 text-white" />
                      )}
                    </div>
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
                    phone: null,
                    verified: chat.verified
                  })}
                  className={`flex items-center px-3 py-3 hover:bg-[#f5f6f6] cursor-pointer transition-colors group border-b border-slate-50 ${selectedChatId === chat.id ? 'bg-[#f0f2f5]' : ''}`}
                >
                  <div className="relative">
                    <img src={chat.avatar_url} alt={chat.username} className="w-12 h-12 rounded-full object-cover mr-3 bg-slate-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="flex items-center gap-1">
                        <h3 className="font-medium truncate text-slate-900 text-[16px]">{chat.username}</h3>
                        {chat.verified === 1 && (
                          <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500 text-white" />
                        )}
                      </div>
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
