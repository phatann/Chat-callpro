import { useState, useEffect } from 'react';
import { Search, MoreVertical, MessageSquarePlus, Users, CircleDashed } from 'lucide-react';
import { Chat, User } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  onSelectChat: (user: User) => void;
  selectedChatId?: string;
  onProfileClick: () => void;
}

export default function Sidebar({ onSelectChat, selectedChatId, onProfileClick }: SidebarProps) {
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
    <div className="w-[30%] min-w-[300px] max-w-[400px] border-r border-[#e9edef] h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-[59px] bg-[#f0f2f5] flex items-center justify-between px-4 py-2">
        <div 
          className="cursor-pointer"
          onClick={onProfileClick}
        >
          <img 
            src={user?.avatar_url} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
        <div className="flex items-center gap-3 text-[#54656f]">
          <button className="p-2 rounded-full hover:bg-[#d9dbdf] transition-colors"><Users className="w-5 h-5" /></button>
          <button className="p-2 rounded-full hover:bg-[#d9dbdf] transition-colors"><CircleDashed className="w-5 h-5" /></button>
          <button className="p-2 rounded-full hover:bg-[#d9dbdf] transition-colors"><MessageSquarePlus className="w-5 h-5" /></button>
          <button className="p-2 rounded-full hover:bg-[#d9dbdf] transition-colors"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>
      
      {/* Search */}
      <div className="p-2 border-b border-[#e9edef] bg-white">
        <div className="relative flex items-center bg-[#f0f2f5] rounded-lg px-3 py-1.5">
          <Search className="text-[#54656f] w-4 h-4 mr-3" />
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full bg-transparent text-sm text-[#111b21] focus:outline-none placeholder-[#667781]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {isSearching ? (
          <div>
            {searchResults.map(result => (
              <div 
                key={result.id}
                onClick={() => {
                  onSelectChat(result);
                  setSearchQuery('');
                  setIsSearching(false);
                }}
                className="flex items-center px-3 py-2 hover:bg-[#f5f6f6] cursor-pointer transition-colors"
              >
                <img src={result.avatar_url} alt={result.username} className="w-12 h-12 rounded-full object-cover mr-3" />
                <div className="flex-1 border-b border-[#f2f2f2] py-3">
                  <p className="text-[#111b21] text-[17px]">{result.username}</p>
                  <p className="text-[#667781] text-[14px]">{result.email || result.phone}</p>
                </div>
              </div>
            ))}
            {searchResults.length === 0 && (
              <p className="text-center text-[#667781] text-sm py-4">No users found</p>
            )}
          </div>
        ) : (
          <div>
            {chats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => onSelectChat({ 
                  id: chat.id, 
                  username: chat.username, 
                  avatar_url: chat.avatar_url, 
                  email: null, 
                  phone: null 
                })}
                className={`flex items-center px-3 hover:bg-[#f5f6f6] cursor-pointer transition-colors ${selectedChatId === chat.id ? 'bg-[#f0f2f5]' : ''}`}
              >
                <img src={chat.avatar_url} alt={chat.username} className="w-12 h-12 rounded-full object-cover mr-3" />
                <div className="flex-1 border-b border-[#f2f2f2] py-3 min-w-0 pr-2">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-[#111b21] text-[17px] truncate">{chat.username}</h3>
                    <span className={`text-[12px] whitespace-nowrap ml-2 ${chat.unread_count > 0 ? 'text-[#00a884] font-medium' : 'text-[#667781]'}`}>
                      {new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[#667781] text-[14px] truncate pr-2">
                      {chat.last_message_sender === user?.id ? 'You: ' : ''}{chat.last_message}
                    </p>
                    {chat.unread_count > 0 && (
                      <span className="bg-[#00a884] text-white text-[12px] font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {chat.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
