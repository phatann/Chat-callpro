import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Trash2, Edit2, X, Check, ArrowLeft, Ban, Unlock, Activity, MessageSquare, BadgeCheck, Bot, Sparkles, Send, Search, Filter, MoreHorizontal, UserCheck, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'banned' | 'verified'>('all');
  
  // AI Assistant State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? All their messages will be deleted.')) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBan = async (id: string, currentStatus: number) => {
    const action = currentStatus ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}/${action}`, { method: 'POST' });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, banned: currentStatus ? 0 : 1 } : u));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerify = async (id: string, currentStatus: number) => {
    const action = currentStatus ? 'unverify' : 'verify';
    try {
      const res = await fetch(`/api/admin/users/${id}/${action}`, { method: 'POST' });
      if (res.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, verified: currentStatus ? 0 : 1 } : u));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setEditForm({
      username: user.username,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role
    });
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(users.map(u => u.id === id ? { ...u, ...data.user } : u));
        setEditingId(null);
      } else {
        alert('Failed to update user. Username or email might be taken.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    try {
      const res = await fetch('/api/admin/ai-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery })
      });
      
      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.answer);
      } else {
        setAiResponse('Sorry, I could not process your request at the moment.');
      }
    } catch (e) {
      console.error(e);
      setAiResponse('Error connecting to AI service.');
    } finally {
      setAiLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admin only.</div>;
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (u.phone && u.phone.includes(searchQuery));
    
    if (filter === 'active') return matchesSearch && !u.banned;
    if (filter === 'banned') return matchesSearch && u.banned;
    if (filter === 'verified') return matchesSearch && u.verified;
    return matchesSearch;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(u => !u.banned).length;
  const bannedUsers = users.filter(u => u.banned).length;
  const verifiedUsers = users.filter(u => u.verified).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage users and system settings</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAiPanel(!showAiPanel)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${showAiPanel ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <Sparkles className={`w-4 h-4 ${showAiPanel ? 'text-purple-600' : 'text-slate-400'}`} />
          <span className="font-medium text-sm">AI Assistant</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between"
            >
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between"
            >
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Users</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{activeUsers}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between"
            >
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Banned Users</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{bannedUsers}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between"
            >
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Verified</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{verifiedUsers}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <BadgeCheck className="w-6 h-6 text-purple-600" />
              </div>
            </motion.div>
          </div>

          {/* Controls & Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search users..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
              >
                All Users
              </button>
              <button 
                onClick={() => setFilter('active')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'active' ? 'bg-green-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setFilter('banned')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'banned' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
              >
                Banned
              </button>
              <button 
                onClick={() => setFilter('verified')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'verified' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
              >
                Verified
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-4" />
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <UserX className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-lg font-medium text-slate-700">No users found</p>
                <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="p-4 pl-6 font-semibold text-xs text-slate-500 uppercase tracking-wider">User</th>
                      <th className="p-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Contact Info</th>
                      <th className="p-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="p-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Activity</th>
                      <th className="p-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="p-4 pr-6 font-semibold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence>
                      {filteredUsers.map((u) => (
                        <motion.tr 
                          key={u.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`group hover:bg-slate-50/80 transition-colors ${u.banned ? 'bg-red-50/30' : ''}`}
                        >
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full bg-slate-200 object-cover border border-slate-200" />
                                {u.verified === 1 && (
                                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                    <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500 text-white" />
                                  </div>
                                )}
                              </div>
                              {editingId === u.id ? (
                                <input 
                                  type="text" 
                                  className="border border-blue-300 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                  value={editForm.username}
                                  onChange={e => setEditForm({...editForm, username: e.target.value})}
                                  autoFocus
                                />
                              ) : (
                                <div>
                                  <p className="font-medium text-slate-900">{u.username}</p>
                                  <p className="text-xs text-slate-400 truncate max-w-[120px]">{u.id.slice(0, 8)}...</p>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {editingId === u.id ? (
                              <div className="space-y-2">
                                <input 
                                  type="text" 
                                  placeholder="Email"
                                  className="border border-slate-300 rounded px-2 py-1 text-xs w-full block focus:outline-none focus:border-blue-500"
                                  value={editForm.email}
                                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                                />
                                <input 
                                  type="text" 
                                  placeholder="Phone"
                                  className="border border-slate-300 rounded px-2 py-1 text-xs w-full block focus:outline-none focus:border-blue-500"
                                  value={editForm.phone}
                                  onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                />
                              </div>
                            ) : (
                              <div className="text-sm">
                                <div className="text-slate-700">{u.email || <span className="text-slate-400 italic">No email</span>}</div>
                                <div className="text-slate-500 text-xs mt-0.5">{u.phone || <span className="text-slate-400 italic">No phone</span>}</div>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {editingId === u.id ? (
                              <select 
                                className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                value={editForm.role}
                                onChange={e => setEditForm({...editForm, role: e.target.value})}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                u.role === 'admin' 
                                  ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {u.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="text-xs text-slate-600 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-medium">{u.message_count || 0}</span> messages
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Activity className="w-3.5 h-3.5 text-slate-400" />
                                {u.last_active ? new Date(u.last_active).toLocaleDateString() : 'Never'}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {u.banned ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Banned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {editingId === u.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleSave(u.id)} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleVerify(u.id, u.verified)} 
                                  className={`p-2 rounded-lg transition-all ${u.verified ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                  title={u.verified ? "Remove Verification" : "Verify User"}
                                >
                                  <BadgeCheck className={`w-4 h-4 ${u.verified ? 'fill-blue-600 text-white' : ''}`} />
                                </button>
                                {u.id !== user?.id && (
                                  <button 
                                    onClick={() => handleBan(u.id, u.banned)} 
                                    className={`p-2 rounded-lg transition-all ${u.banned ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'}`}
                                    title={u.banned ? "Unban User" : "Ban User"}
                                  >
                                    {u.banned ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                  </button>
                                )}
                                <button onClick={() => handleEdit(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit User">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {u.id !== user?.id && (
                                  <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete User">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Panel */}
        <AnimatePresence>
          {showAiPanel && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-80 md:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-20"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-2 text-purple-900 font-semibold">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Admin Support
                </div>
                <button onClick={() => setShowAiPanel(false)} className="p-1 hover:bg-purple-100 rounded-full text-slate-400 hover:text-purple-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
                {aiResponse ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-700 leading-relaxed border border-purple-100"
                  >
                    <div className="flex items-center gap-2 mb-2 text-purple-700 font-medium text-xs uppercase tracking-wider">
                      <Bot className="w-3.5 h-3.5" />
                      AI Assistant
                    </div>
                    {aiResponse}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-8">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-purple-300" />
                    </div>
                    <h3 className="text-slate-700 font-medium mb-1">How can I help?</h3>
                    <p className="text-sm">Ask me about user management, resolving conflicts, or system issues.</p>
                    
                    <div className="mt-6 grid gap-2 w-full">
                      <button onClick={() => setAiQuery("How do I handle a reported user?")} className="text-xs bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-600 p-2 rounded-lg transition-colors text-left">
                        "How do I handle a reported user?"
                      </button>
                      <button onClick={() => setAiQuery("Best practices for moderation?")} className="text-xs bg-white border border-slate-200 hover:border-purple-300 hover:text-purple-600 p-2 rounded-lg transition-colors text-left">
                        "Best practices for moderation?"
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleAiAsk} className="p-4 border-t border-slate-100 bg-white">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask for help..."
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-slate-50 focus:bg-white transition-all shadow-sm"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    disabled={aiLoading}
                  />
                  <button 
                    type="submit" 
                    disabled={aiLoading || !aiQuery.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:bg-slate-300 transition-colors shadow-sm"
                  >
                    {aiLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
