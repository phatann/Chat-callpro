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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-[#008069] text-white p-4 flex items-center gap-4 shadow-md z-10">
        <button onClick={onBack} className="p-1 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h2 className="font-semibold text-lg">Select Contact</h2>
          <p className="text-xs text-white/80">{contacts.length} contacts</p>
        </div>
        <div className="p-2">
          <Search className="w-5 h-5" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-2 bg-white border-b border-slate-100">
        <div className="bg-slate-100 rounded-lg flex items-center px-4 py-2">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="bg-transparent border-none focus:outline-none text-slate-700 w-full placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008069]"></div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>No contacts found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredContacts.map(user => (
              <motion.button
                key={user.id}
                whileTap={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                onClick={() => onSelectUser(user)}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="relative">
                  <img 
                    src={user.avatar_url} 
                    alt={user.username} 
                    className="w-12 h-12 rounded-full object-cover bg-slate-200"
                  />
                  {/* We could add online status indicator here if we had real-time status in this list */}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 truncate">{user.username}</h3>
                  <p className="text-sm text-slate-500 truncate">{user.status || "Hey there! I am using Alpha."}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
