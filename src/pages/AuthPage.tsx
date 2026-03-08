import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Mail, Lock, Phone, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? formData : { identifier: formData.email || formData.phone, password: formData.password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      
      login(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-slate-100">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[100px]"></div>
        <div className="absolute bottom-0 left-1/2 w-[60%] h-[30%] rounded-full bg-purple-500/10 blur-[100px] transform -translate-x-1/2"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[420px]"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-teal-500 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20 rotate-3 hover:rotate-6 transition-transform duration-300"
          >
            <Send className="w-12 h-12 text-white ml-1" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Alpha 3.1</h1>
          <p className="text-slate-400 text-lg">Professional Messaging for Teams</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
          <div className="p-8 md:p-10">
            <AnimatePresence mode="wait">
              {isRegister ? (
                <motion.form
                  key="register"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-white">Create Account</h2>
                    <p className="text-slate-400 text-sm mt-1">Join the community today</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative group">
                      <User className="absolute left-4 top-3.5 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="text"
                        placeholder="Username"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        required
                      />
                    </div>

                    <div className="relative group">
                      <Mail className="absolute left-4 top-3.5 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="email"
                        placeholder="Email (Optional)"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>

                    <div className="relative group">
                      <Phone className="absolute left-4 top-3.5 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="tel"
                        placeholder="Phone (Optional)"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="password"
                        placeholder="Password"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 py-2.5 rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign Up <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="login"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-semibold text-white">Welcome Back</h2>
                    <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative group">
                      <User className="absolute left-4 top-3.5 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="text"
                        placeholder="Email or Phone"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 text-slate-500 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                      <input
                        type="password"
                        placeholder="Password"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-white placeholder:text-slate-600"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 py-2.5 rounded-xl"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
          
          <div className="bg-slate-900/30 p-5 text-center border-t border-white/5 backdrop-blur-md">
            <button 
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-sm text-slate-400 font-medium hover:text-white transition-colors"
            >
              {isRegister ? (
                <span>Already have an account? <span className="text-blue-400">Log in</span></span>
              ) : (
                <span>Don't have an account? <span className="text-blue-400">Sign up</span></span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs font-medium tracking-wide opacity-60">
            © 2024 Alpha Inc. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
