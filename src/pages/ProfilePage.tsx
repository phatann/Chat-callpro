import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Camera, ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfilePageProps {
  onBack: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
    status: user?.status || 'Hey there! I am using Alpha',
    password: ''
  });

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

      login(data.user); // Update context
      setSuccess('Profile updated successfully');
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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-4 shadow-sm z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Settings</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar"
      >
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center mb-8">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative group cursor-pointer" 
                onClick={generateRandomAvatar}
              >
                <img 
                  src={formData.avatar_url} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-slate-100 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${formData.username}`;
                  }}
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <p className="mt-3 text-sm text-slate-500 font-medium">Click to change avatar</p>
              
              <div className="mt-4 w-full max-w-sm">
                <input
                  type="text"
                  value={formData.avatar_url}
                  onChange={e => setFormData({...formData, avatar_url: e.target.value})}
                  className="w-full px-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center text-slate-500 bg-slate-50 transition-all"
                  placeholder="Or paste an image URL"
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-2.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bio</label>
                  <div className="relative group">
                    <Info className="absolute left-3 top-2.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50 focus:bg-white"
                      placeholder="Hey there! I am using Alpha"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-2.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-2.5 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="col-span-2 pt-6 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Security</h3>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                  <div className="relative group">
                    <input
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all bg-slate-50 focus:bg-white"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100 flex items-center gap-2"
                  >
                    <Info className="w-4 h-4" />
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
