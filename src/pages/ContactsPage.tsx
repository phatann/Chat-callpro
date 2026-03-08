import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquare, ArrowLeft } from 'lucide-react';
import { User } from '../types';

interface ContactsPageProps {
  onBack: () => void;
  onSelectUser: (user: User) => void;
}

export default function ContactsPage({ onBack, onSelectUser }: ContactsPageProps) {
  const [contacts, setContacts] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.users && Array.isArray(data.users)) {
          setContacts(data.users);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching contacts:', err);
        setLoading(false);
      });
  }, []);

  const filteredContacts = contacts.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.phone && user.phone.includes(searchQuery))
  );

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center gap-4 shadow-sm z-10 border-b border-slate-100">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="font-semibold text-lg text-slate-800">New Chat</h2>
          <p className="text-xs text-slate-500 font-medium">{contacts.length} contacts</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl leading-5 bg-slate-100 text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-sm transition-all text-sm"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Search className="w-12 h-12 mb-3 opacity-10" />
            <p className="text-sm font-medium">No contacts found</p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              All Contacts
            </div>
            {filteredContacts.map((user, index) => (
              <motion.button
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelectUser(user)}
                className="w-full p-3 flex items-center gap-3.5 hover:bg-slate-50 rounded-xl transition-all text-left group"
              >
                <div className="relative">
                  <img 
                    src={user.avatar_url} 
                    alt={user.username} 
                    className="w-12 h-12 rounded-full object-cover bg-slate-100 border border-slate-100 group-hover:border-blue-100 transition-colors"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate text-[15px] group-hover:text-blue-600 transition-colors">{user.username}</h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user.status || "Hey there! I am using Alpha."}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
