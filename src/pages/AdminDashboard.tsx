import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Trash2, Edit2, X, Check, ArrowLeft, Ban, Unlock, Activity, MessageSquare, BadgeCheck, Bot, Sparkles, Send, Search, Filter, MoreHorizontal, UserCheck, UserX, Lock, LayoutDashboard, Users, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'banned' | 'verified'>('overview');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<any>>({});
  const [passwordResetId, setPasswordResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

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

  const handlePasswordReset = async (id: string) => {
    if (!newPassword.trim()) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      
      if (res.ok) {
        alert('Password updated successfully');
        setPasswordResetId(null);
        setNewPassword('');
      } else {
        alert('Failed to update password');
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
    
    if (activeTab === 'banned') return matchesSearch && u.banned;
    if (activeTab === 'verified') return matchesSearch && u.verified;
    return matchesSearch;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(u => !u.banned).length;
  const bannedUsers = users.filter(u => u.banned).length;
  const verifiedUsers = users.filter(u => u.verified).length;

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
        activeTab === id 
          ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Admin Panel
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Advanced Control System</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAiPanel(!showAiPanel)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border shadow-sm ${showAiPanel ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-purple-100' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
        >
          <Sparkles className={`w-4 h-4 ${showAiPanel ? 'text-purple-600' : 'text-slate-400'}`} />
          <span className="font-semibold text-sm">AI Assistant</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <TabButton id="overview" label="Overview" icon={LayoutDashboard} />
        <TabButton id="users" label="User Management" icon={UserCog} />
        <TabButton id="banned" label="Banned Users" icon={Ban} />
        <TabButton id="verified" label="Verified Users" icon={BadgeCheck} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar pb-20">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Users</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{totalUsers}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Users</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{activeUsers}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Banned</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{bannedUsers}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl">
                    <Ban className="w-6 h-6 text-red-600" />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Verified</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{verifiedUsers}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <BadgeCheck className="w-6 h-6 text-purple-600" />
                  </div>
                </motion.div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
                <div className="text-slate-500 text-sm italic">System logs and activity tracking coming soon...</div>
              </div>
            </div>
          )}

          {/* User Management / Banned / Verified Tabs */}
          {activeTab !== 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                    <p className="font-medium">Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-16 text-center text-slate-500 flex flex-col items-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-4">
                      <UserX className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-semibold text-slate-700">No users found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <th className="p-4 pl-6 font-bold text-xs text-slate-500 uppercase tracking-wider">User</th>
                          <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Contact Info</th>
                          <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Role</th>
                          <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="p-4 pr-6 font-bold text-xs text-slate-500 uppercase tracking-wider text-right">Actions</th>
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
                                    <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full bg-slate-100 object-cover border border-slate-200 group-hover:border-blue-200 transition-colors" />
                                    {u.verified === 1 && (
                                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                        <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  {editingId === u.id ? (
                                    <input 
                                      type="text" 
                                      className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                      value={editForm.username}
                                      onChange={e => setEditForm({...editForm, username: e.target.value})}
                                      autoFocus
                                    />
                                  ) : (
                                    <div>
                                      <p className="font-semibold text-slate-900 text-sm">{u.username}</p>
                                      <p className="text-[10px] text-slate-400 truncate max-w-[120px] font-mono mt-0.5">{u.id.slice(0, 8)}...</p>
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
                                    {activeTab === 'users' && (
                                      <>
                                        <button onClick={() => setPasswordResetId(u.id)} className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all" title="Reset Password">
                                          <Lock className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleEdit(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit User">
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        {u.id !== user?.id && (
                                          <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete User">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </>
                                    )}
                                    
                                    {activeTab === 'banned' && (
                                      <button 
                                        onClick={() => handleBan(u.id, u.banned)} 
                                        className="p-2 rounded-lg transition-all bg-green-50 text-green-600 hover:bg-green-100"
                                        title="Unban User"
                                      >
                                        <Unlock className="w-4 h-4" /> Unban
                                      </button>
                                    )}

                                    {activeTab === 'verified' && (
                                      <button 
                                        onClick={() => handleVerify(u.id, u.verified)} 
                                        className="p-2 rounded-lg transition-all bg-red-50 text-red-600 hover:bg-red-100"
                                        title="Remove Verification"
                                      >
                                        <X className="w-4 h-4" /> Revoke
                                      </button>
                                    )}
                                    
                                    {/* Fallback for Overview or general actions if needed */}
                                    {activeTab === 'overview' && (
                                      <button onClick={() => setActiveTab('users')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                        <MoreHorizontal className="w-4 h-4" />
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
          )}
        </div>

        {/* AI Assistant Panel */}
        <AnimatePresence>
          {showAiPanel && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-80 md:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-20 absolute right-0 top-0 bottom-0"
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

        {/* Password Reset Modal */}
        <AnimatePresence>
          {passwordResetId && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-800">Reset Password</h3>
                  <button onClick={() => setPasswordResetId(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-500 mb-4">Enter a new password for this user. This action cannot be undone.</p>
                  <input 
                    type="password" 
                    placeholder="New Password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm mb-4"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setPasswordResetId(null)}
                      className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handlePasswordReset(passwordResetId)}
                      disabled={!newPassword.trim()}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 p-4 text-center text-xs text-slate-400 font-medium">
        &copy; {new Date().getFullYear()} Abdul Rahman Habib Team. All rights reserved.
      </div>
    </div>
  );
}
