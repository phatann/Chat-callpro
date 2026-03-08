import { useState, useEffect, FormEvent } from 'react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'banned' | 'verified' | 'controls'>('overview');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<any>>({});
  const [passwordResetId, setPasswordResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Controls Tab State
  const [controlSearch, setControlSearch] = useState('');
  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [controlLoading, setControlLoading] = useState(false);

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

  const handleControlSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!controlSearch.trim()) return;
    
    setControlLoading(true);
    setTargetUser(null);
    
    // Simulate search by filtering existing users state (since we have all users)
    const found = users.find(u => 
      u.email?.toLowerCase() === controlSearch.toLowerCase() || 
      u.username.toLowerCase() === controlSearch.toLowerCase()
    );

    setTimeout(() => {
      setTargetUser(found || null);
      setControlLoading(false);
    }, 500);
  };

  const executeControlAction = async (action: string) => {
    if (!targetUser) return;
    
    switch (action) {
      case 'ban':
        await handleBan(targetUser.id, 0);
        setTargetUser((prev: any) => ({...prev, banned: 1}));
        break;
      case 'unban':
        await handleBan(targetUser.id, 1);
        setTargetUser((prev: any) => ({...prev, banned: 0}));
        break;
      case 'verify':
        await handleVerify(targetUser.id, 0);
        setTargetUser((prev: any) => ({...prev, verified: 1}));
        break;
      case 'revoke':
        await handleVerify(targetUser.id, 1);
        setTargetUser((prev: any) => ({...prev, verified: 0}));
        break;
      case 'reset':
        setPasswordResetId(targetUser.id);
        break;
      case 'delete':
        await handleDelete(targetUser.id);
        setTargetUser(null);
        break;
    }
  };

  const handleAiAsk = async (e: FormEvent) => {
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

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admin or Manager only.</div>;
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
      className={`flex items-center gap-2 px-6 py-1.5 text-xs font-medium border-r border-t border-l border-slate-300 -mb-px select-none ${
        activeTab === id 
          ? 'bg-white text-slate-900 font-bold border-t-2 border-t-blue-600 z-10' 
          : 'bg-slate-100 text-slate-500 hover:bg-slate-50 border-b border-b-slate-300'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f0f0f0] font-sans text-sm relative">
      {/* Toolbar / Menu Bar */}
      <div className="bg-[#f3f3f3] px-2 py-1 flex items-center justify-between border-b border-slate-300 shadow-sm z-10 select-none">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack} 
            className="p-1 hover:bg-slate-200 border border-transparent hover:border-slate-300 rounded-sm text-slate-600 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <div className="flex items-center gap-2 px-2">
            <Shield className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-slate-700 tracking-tight">SYS_ADMIN_PANEL_V3.1</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-2 py-0.5 bg-white border border-slate-300 text-[10px] font-mono text-slate-500">
              {new Date().toISOString().split('T')[0]}
           </div>
           <button 
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs border rounded-sm transition-all ${
              showAiPanel 
                ? 'bg-purple-100 border-purple-300 text-purple-800' 
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>AI_ASSIST</span>
          </button>
        </div>
      </div>

      {/* Formula Bar / Search Area */}
      <div className="bg-white border-b border-slate-300 p-2 flex items-center gap-2">
         <div className="px-2 py-1 bg-slate-100 border border-slate-300 text-xs font-mono text-slate-500 w-24 text-center select-none">
            FX:SEARCH
         </div>
         <div className="flex-1 relative">
            <input 
              type="text" 
              className="w-full h-7 px-2 text-sm border border-slate-300 focus:border-blue-500 focus:outline-none font-mono"
              placeholder="Query database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden p-2">
        
        {/* Tabs Container */}
        <div className="flex items-end border-b border-slate-300 px-2 gap-1">
          <TabButton id="overview" label="DASHBOARD" icon={LayoutDashboard} />
          <TabButton id="users" label="USER_DB" icon={UserCog} />
          <TabButton id="banned" label="BLACKLIST" icon={Ban} />
          <TabButton id="verified" label="VERIFIED_LIST" icon={BadgeCheck} />
          <TabButton id="controls" label="CONTROLS" icon={Shield} />
        </div>

        {/* Content Pane */}
        <div className="flex-1 bg-white border-l border-r border-b border-slate-300 overflow-hidden flex flex-col shadow-sm">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            
            {/* Controls Tab */}
            {activeTab === 'controls' && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-slate-100 border border-slate-300 p-4 mb-6">
                  <div className="text-xs font-mono font-bold text-slate-500 mb-2 uppercase">Target Identification</div>
                  <form onSubmit={handleControlSearch} className="flex gap-2">
                    <input 
                      type="text" 
                      value={controlSearch}
                      onChange={(e) => setControlSearch(e.target.value)}
                      placeholder="ENTER_USERNAME_OR_EMAIL"
                      className="flex-1 px-3 py-2 border border-slate-300 font-mono text-sm focus:outline-none focus:border-blue-600 uppercase"
                    />
                    <button 
                      type="submit"
                      disabled={controlLoading}
                      className="px-4 py-2 bg-slate-700 text-white font-mono text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
                    >
                      {controlLoading ? 'SCANNING...' : 'LOCATE_TARGET'}
                    </button>
                  </form>
                </div>

                {targetUser ? (
                  <div className="border-2 border-slate-800 bg-white p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="bg-slate-800 text-white px-2 py-1 text-xs font-mono font-bold flex justify-between">
                      <span>TARGET_ACQUIRED: {targetUser.id}</span>
                      <span className={targetUser.banned ? 'text-red-400' : 'text-green-400'}>
                        {targetUser.banned ? 'STATUS: RESTRICTED' : 'STATUS: ACTIVE'}
                      </span>
                    </div>
                    
                    <div className="p-4 grid grid-cols-[100px_1fr] gap-6">
                      <div className="border border-slate-300 bg-slate-50 p-1">
                        <img src={targetUser.avatar_url} alt="" className="w-full h-full object-cover grayscale contrast-125" />
                      </div>
                      <div className="font-mono text-xs space-y-2">
                        <div className="grid grid-cols-[100px_1fr] border-b border-slate-200 pb-1">
                          <span className="text-slate-500">USERNAME:</span>
                          <span className="font-bold">{targetUser.username}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] border-b border-slate-200 pb-1">
                          <span className="text-slate-500">EMAIL:</span>
                          <span>{targetUser.email || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] border-b border-slate-200 pb-1">
                          <span className="text-slate-500">ROLE:</span>
                          <span className="uppercase">{targetUser.role}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] border-b border-slate-200 pb-1">
                          <span className="text-slate-500">VERIFIED:</span>
                          <span className={targetUser.verified ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                            {targetUser.verified ? 'TRUE' : 'FALSE'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-100 border-t border-slate-300 p-4">
                      <div className="text-[10px] font-mono font-bold text-slate-400 mb-3 uppercase tracking-wider">Available Actions</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {targetUser.banned ? (
                          <button onClick={() => executeControlAction('unban')} className="p-2 border border-green-600 bg-green-50 text-green-700 font-mono text-xs font-bold hover:bg-green-100 flex items-center justify-center gap-2">
                            <Check className="w-3 h-3" /> UNBAN_USER
                          </button>
                        ) : (
                          <button onClick={() => executeControlAction('ban')} className="p-2 border border-red-600 bg-red-50 text-red-700 font-mono text-xs font-bold hover:bg-red-100 flex items-center justify-center gap-2">
                            <Ban className="w-3 h-3" /> BAN_USER
                          </button>
                        )}

                        {targetUser.verified ? (
                          <button onClick={() => executeControlAction('revoke')} className="p-2 border border-orange-400 bg-orange-50 text-orange-700 font-mono text-xs font-bold hover:bg-orange-100 flex items-center justify-center gap-2">
                            <X className="w-3 h-3" /> REVOKE_VERIFY
                          </button>
                        ) : (
                          <button onClick={() => executeControlAction('verify')} className="p-2 border border-blue-600 bg-blue-50 text-blue-700 font-mono text-xs font-bold hover:bg-blue-100 flex items-center justify-center gap-2">
                            <BadgeCheck className="w-3 h-3" /> VERIFY_USER
                          </button>
                        )}

                        <button onClick={() => executeControlAction('reset')} className="p-2 border border-slate-400 bg-white text-slate-700 font-mono text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-2">
                          <Lock className="w-3 h-3" /> RESET_PASS
                        </button>

                        <button onClick={() => executeControlAction('delete')} className="p-2 border border-slate-400 bg-slate-200 text-slate-600 font-mono text-xs font-bold hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center gap-2 transition-colors">
                          <Trash2 className="w-3 h-3" /> DELETE_RECORD
                        </button>
                      </div>
                    </div>
                  </div>
                ) : controlSearch && !controlLoading && (
                  <div className="p-8 text-center border border-dashed border-slate-300 text-slate-400 font-mono text-xs">
                    TARGET_NOT_FOUND_IN_DATABASE
                  </div>
                )}
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-300 border border-slate-300">
                  {[
                    { label: 'TOTAL_RECORDS', value: totalUsers, icon: Users, color: 'text-blue-700' },
                    { label: 'ACTIVE_SESSIONS', value: activeUsers, icon: Activity, color: 'text-green-700' },
                    { label: 'RESTRICTED', value: bannedUsers, icon: Ban, color: 'text-red-700' },
                    { label: 'VERIFIED_ACCOUNTS', value: verifiedUsers, icon: BadgeCheck, color: 'text-purple-700' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-3 flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">{stat.label}</div>
                        <div className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</div>
                      </div>
                      <stat.icon className={`w-5 h-5 opacity-50 ${stat.color}`} />
                    </div>
                  ))}
                </div>

                <div className="border border-slate-300">
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 text-xs font-bold text-slate-700 uppercase">
                    System_Log_Stream
                  </div>
                  <div className="p-4 bg-slate-50 min-h-[200px] font-mono text-xs text-slate-500">
                    <div className="flex gap-4 border-b border-slate-200 py-1">
                      <span className="text-slate-400">[{new Date().toLocaleTimeString()}]</span>
                      <span>System initialized. Waiting for input...</span>
                    </div>
                    <div className="flex gap-4 border-b border-slate-200 py-1">
                      <span className="text-slate-400">[{new Date().toLocaleTimeString()}]</span>
                      <span>Database connection established.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Grid Views */}
            {activeTab !== 'overview' && activeTab !== 'controls' && (
              <div className="h-full flex flex-col">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs">
                    LOADING_DATA_SET...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-slate-400 font-mono text-xs">
                    NO_RECORDS_FOUND
                  </div>
                ) : (
                  <div className="border border-slate-300 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600">
                          <th className="border-r border-b border-slate-300 px-3 py-2 font-bold w-12 text-center">ID</th>
                          <th className="border-r border-b border-slate-300 px-3 py-2 font-bold">USER_IDENTITY</th>
                          <th className="border-r border-b border-slate-300 px-3 py-2 font-bold">CONTACT_DATA</th>
                          <th className="border-r border-b border-slate-300 px-3 py-2 font-bold w-32">ACCESS_LEVEL</th>
                          <th className="border-r border-b border-slate-300 px-3 py-2 font-bold w-24">STATE</th>
                          <th className="border-b border-slate-300 px-3 py-2 font-bold text-right">CONTROLS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u, idx) => (
                          <tr key={u.id} className="hover:bg-blue-50 group">
                            <td className="border-r border-b border-slate-200 px-3 py-2 text-center text-slate-400 bg-slate-50">
                              {idx + 1}
                            </td>
                            <td className="border-r border-b border-slate-200 px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-200 border border-slate-300 flex-shrink-0">
                                  <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                </div>
                                {editingId === u.id ? (
                                  <input 
                                    type="text" 
                                    className="border border-blue-500 px-1 py-0.5 w-full bg-white focus:outline-none"
                                    value={editForm.username}
                                    onChange={e => setEditForm({...editForm, username: e.target.value})}
                                    autoFocus
                                  />
                                ) : (
                                  <div>
                                    <div className="font-bold text-slate-800">{u.username}</div>
                                    <div className="text-[10px] text-slate-400">{u.id}</div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="border-r border-b border-slate-200 px-3 py-2">
                              {editingId === u.id ? (
                                <div className="space-y-1">
                                  <input 
                                    type="text" 
                                    className="border border-slate-300 px-1 py-0.5 w-full focus:border-blue-500 focus:outline-none"
                                    value={editForm.email}
                                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                                    placeholder="Email"
                                  />
                                  <input 
                                    type="text" 
                                    className="border border-slate-300 px-1 py-0.5 w-full focus:border-blue-500 focus:outline-none"
                                    value={editForm.phone}
                                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                    placeholder="Phone"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="text-slate-700">{u.email || '-'}</div>
                                  <div className="text-slate-500">{u.phone || '-'}</div>
                                </div>
                              )}
                            </td>
                            <td className="border-r border-b border-slate-200 px-3 py-2">
                              {editingId === u.id ? (
                                <select 
                                  className="border border-slate-300 px-1 py-0.5 w-full focus:border-blue-500 focus:outline-none"
                                  value={editForm.role}
                                  onChange={e => setEditForm({...editForm, role: e.target.value})}
                                >
                                  <option value="user">USER</option>
                                  <option value="employee">EMPLOYEE</option>
                                  <option value="manager">MANAGER</option>
                                  <option value="admin">ADMIN</option>
                                </select>
                              ) : (
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                                  u.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                                  u.role === 'manager' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                                  u.role === 'employee' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                                  'bg-slate-100 text-slate-600 border-slate-300'
                                }`}>
                                  {u.role.toUpperCase()}
                                </span>
                              )}
                            </td>
                            <td className="border-r border-b border-slate-200 px-3 py-2">
                                {u.banned ? (
                                  <span className="text-red-600 font-bold bg-red-50 px-1 border border-red-200">BANNED</span>
                                ) : (
                                  <span className="text-green-600 font-bold bg-green-50 px-1 border border-green-200">ACTIVE</span>
                                )}
                            </td>
                              <td className="border-b border-slate-200 px-3 py-2 text-right">
                              {editingId === u.id ? (
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => handleSave(u.id)} className="px-2 py-1 bg-green-600 text-white hover:bg-green-700 text-[10px] uppercase">Save</button>
                                  <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 text-[10px] uppercase">Cancel</button>
                                </div>
                              ) : (
                                <div className="flex justify-end gap-1">
                                   {activeTab === 'users' && (
                                      <>
                                        <button onClick={() => setPasswordResetId(u.id)} className="p-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600" title="Reset Password">
                                          <Lock className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => handleEdit(u)} className="p-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-600" title="Edit">
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        {u.id !== user?.id && (
                                          <button onClick={() => handleDelete(u.id)} className="p-1 border border-slate-300 bg-white hover:bg-red-50 text-red-600" title="Delete">
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </>
                                   )}
                                   {activeTab === 'banned' && (
                                      <button onClick={() => handleBan(u.id, u.banned)} className="px-2 py-0.5 border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 text-[10px] font-bold">
                                        UNBAN
                                      </button>
                                   )}
                                   {activeTab === 'verified' && (
                                      <button onClick={() => handleVerify(u.id, u.verified)} className="px-2 py-0.5 border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-bold">
                                        REVOKE
                                      </button>
                                   )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Status Bar */}
          <div className="bg-[#f3f3f3] border-t border-slate-300 px-2 py-1 flex justify-between items-center text-[10px] text-slate-500 font-mono select-none">
            <div>READY</div>
            <div className="flex gap-4">
              <span>Ln {filteredUsers.length}, Col 6</span>
              <span>UTF-8</span>
              <span>MEM: {Math.round(Math.random() * 40 + 20)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant Panel (Floating Window Style) */}
      <AnimatePresence>
        {showAiPanel && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-4 top-12 w-80 bg-[#f0f0f0] border-2 border-slate-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] z-50 flex flex-col"
            style={{ height: 'calc(100% - 100px)' }}
          >
            <div className="bg-slate-700 text-white px-2 py-1 flex items-center justify-between cursor-move select-none">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Bot className="w-3 h-3" />
                <span>AI_HELPER.EXE</span>
              </div>
              <button onClick={() => setShowAiPanel(false)} className="hover:bg-red-500 p-0.5 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
            
            <div className="flex-1 p-2 overflow-y-auto bg-white font-mono text-xs border-b border-slate-300">
               {aiResponse ? (
                 <div className="whitespace-pre-wrap text-slate-700">{aiResponse}</div>
               ) : (
                 <div className="text-slate-400 text-center mt-10">
                   // WAITING FOR INPUT...<br/>
                   // TYPE QUERY BELOW
                 </div>
               )}
            </div>

            <form onSubmit={handleAiAsk} className="p-2 bg-[#e0e0e0]">
              <div className="flex gap-1">
                <input
                  type="text"
                  className="flex-1 h-8 px-2 text-xs border border-slate-400 focus:outline-none focus:border-blue-600 font-mono"
                  placeholder="CMD_INPUT..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  disabled={aiLoading}
                />
                <button 
                  type="submit" 
                  disabled={aiLoading}
                  className="px-3 bg-slate-300 border border-slate-400 text-xs font-bold hover:bg-slate-400 active:bg-slate-500 active:text-white transition-colors"
                >
                  RUN
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal (Window Style) */}
      <AnimatePresence>
        {passwordResetId && (
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#f0f0f0] border-2 border-slate-500 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] w-96"
            >
              <div className="bg-slate-800 text-white px-2 py-1 flex items-center justify-between select-none">
                <span className="text-xs font-bold">SECURITY_OVERRIDE</span>
                <button onClick={() => setPasswordResetId(null)} className="hover:bg-red-500 p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs font-mono text-slate-700 mb-4">
                  WARNING: RESETTING CREDENTIALS FOR USER_ID: {passwordResetId}
                </p>
                <input 
                  type="password" 
                  placeholder="ENTER_NEW_PASSWORD"
                  className="w-full px-2 py-1.5 text-sm border border-slate-400 font-mono focus:outline-none focus:border-blue-600 mb-4 bg-white"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setPasswordResetId(null)}
                    className="px-3 py-1 border border-slate-400 bg-white hover:bg-slate-100 text-xs font-bold"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={() => handlePasswordReset(passwordResetId)}
                    className="px-3 py-1 border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold"
                  >
                    EXECUTE
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
