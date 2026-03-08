import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Camera, ArrowLeft, Save, Loader2, Info, Bell, Shield, Smartphone, Globe, Moon, Volume2, Lock, LogOut, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile Form Data
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
    status: user?.status || 'Hey there! I am using Alpha',
    presence: 'online',
    password: ''
  });

  // Settings State (Mock for now, would persist to DB/LocalStorage)
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    desktop: true,
    theme: 'light',
    language: 'English',
    twoFactor: false
  });

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'privacy') {
      fetchBlockedUsers();
    }
  }, [activeTab]);

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch('/api/users/me/blocked');
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blocked);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/unblock`, { method: 'POST' });
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');

      login(data.user);
      setSuccess('Settings updated successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setFormData({ ...formData, avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${seed}` });
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        activeTab === id 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-4 shadow-sm z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Settings</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation (Desktop) */}
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 gap-1">
          <TabButton id="profile" label="My Profile" icon={User} />
          <TabButton id="notifications" label="Notifications" icon={Bell} />
          <TabButton id="privacy" label="Privacy & Security" icon={Shield} />
          <TabButton id="system" label="System" icon={Smartphone} />
        </div>

        {/* Mobile Navigation (Top) */}
        <div className="md:hidden flex overflow-x-auto p-2 bg-white border-b border-slate-200 gap-2 no-scrollbar">
          <TabButton id="profile" label="Profile" icon={User} />
          <TabButton id="notifications" label="Notify" icon={Bell} />
          <TabButton id="privacy" label="Privacy" icon={Shield} />
          <TabButton id="system" label="System" icon={Smartphone} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-2xl mx-auto">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex flex-col items-center mb-8">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="relative group cursor-pointer" 
                      onClick={generateRandomAvatar}
                    >
                      <img 
                        src={formData.avatar_url} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-slate-100 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${formData.username}`;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </motion.div>
                    <button onClick={generateRandomAvatar} className="mt-2 text-xs text-blue-600 font-medium hover:underline">
                      Change Avatar
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Display Name</label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={e => setFormData({...formData, username: e.target.value})}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Message</label>
                        <input
                          type="text"
                          value={formData.status}
                          onChange={e => setFormData({...formData, status: e.target.value})}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Presence</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['online', 'busy', 'away', 'offline'].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setFormData({ ...formData, presence: status })}
                              className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all flex flex-col items-center gap-1 ${
                                formData.presence === status
                                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${
                                status === 'online' ? 'bg-green-500' :
                                status === 'busy' ? 'bg-red-500' :
                                status === 'away' ? 'bg-yellow-500' : 'bg-slate-400'
                              }`} />
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Profile
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Notification Preferences</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Push Notifications</p>
                          <p className="text-xs text-slate-500">Receive notifications for new messages</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, notifications: !settings.notifications})}
                        className={`w-11 h-6 rounded-full transition-colors relative ${settings.notifications ? 'bg-blue-600' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.notifications ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                          <Volume2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Sound</p>
                          <p className="text-xs text-slate-500">Play a sound for incoming messages</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, sound: !settings.sound})}
                        className={`w-11 h-6 rounded-full transition-colors relative ${settings.sound ? 'bg-blue-600' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.sound ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Security</h3>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Change Password</label>
                        <input
                          type="password"
                          placeholder="New Password"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                          className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                        />
                        <p className="text-xs text-slate-400 mt-1">Leave blank to keep current password</p>
                      </div>
                      <div className="flex justify-end">
                        <button type="submit" className="text-sm text-blue-600 font-medium hover:underline">Update Password</button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">Blocked Users</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {blockedUsers.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        No blocked users
                      </div>
                    ) : (
                      blockedUsers.map(u => (
                        <div key={u.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={u.avatar_url} className="w-8 h-8 rounded-full bg-slate-100" alt="" />
                            <span className="text-sm font-medium text-slate-900">{u.username}</span>
                          </div>
                          <button 
                            onClick={() => handleUnblock(u.id)}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg transition-colors"
                          >
                            Unblock
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-800">App Settings</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                          <Moon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Dark Mode</p>
                          <p className="text-xs text-slate-500">Switch between light and dark themes</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, theme: settings.theme === 'light' ? 'dark' : 'light'})}
                        className={`w-11 h-6 rounded-full transition-colors relative ${settings.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Language</p>
                          <p className="text-xs text-slate-500">Select your preferred language</p>
                        </div>
                      </div>
                      <select 
                        value={settings.language}
                        onChange={(e) => setSettings({...settings, language: e.target.value})}
                        className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
                      >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Alpha Messenger</p>
                  <p className="text-xs text-slate-500">Version 3.1.0 (Build 2026.03.08)</p>
                  <div className="mt-6">
                    <button className="text-red-600 text-sm font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"
                >
                  <Info className="w-4 h-4" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}
