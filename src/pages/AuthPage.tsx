import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare } from 'lucide-react';

export default function AuthPage() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
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
    }
  };

  return (
    <div className="min-h-screen bg-[#d1d7db] relative overflow-hidden flex flex-col">
      {/* Green top band */}
      <div className="absolute top-0 left-0 w-full h-[222px] bg-[#00a884] -z-10"></div>
      
      {/* Header */}
      <div className="max-w-[1000px] w-full mx-auto pt-8 pb-8 px-4 flex items-center gap-3 text-white">
        <MessageSquare className="w-8 h-8 fill-current" />
        <span className="text-sm font-medium uppercase tracking-wide">WhatsApp Web Clone</span>
      </div>

      {/* Main Card */}
      <div className="max-w-[1000px] w-full mx-auto bg-white rounded shadow-lg flex-1 mb-8 flex overflow-hidden">
        <div className="flex-1 p-12 flex flex-col justify-center">
          <h1 className="text-[28px] font-light text-[#41525d] mb-10">
            {isRegister ? 'Create an account' : 'Use WhatsApp on your computer'}
          </h1>
          
          <div className="max-w-md">
            <div className="flex gap-6 mb-8 border-b border-[#e9edef]">
              <button 
                onClick={() => setIsRegister(false)}
                className={`pb-3 text-sm font-medium transition-colors relative ${!isRegister ? 'text-[#00a884]' : 'text-[#667781]'}`}
              >
                Login
                {!isRegister && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#00a884] rounded-t-md"></div>}
              </button>
              <button 
                onClick={() => setIsRegister(true)}
                className={`pb-3 text-sm font-medium transition-colors relative ${isRegister ? 'text-[#00a884]' : 'text-[#667781]'}`}
              >
                Register
                {isRegister && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#00a884] rounded-t-md"></div>}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div>
                  <label className="block text-sm text-[#667781] mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-[#f0f2f5] border-none rounded focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm text-[#667781] mb-1">{isRegister ? "Email (Optional)" : "Email or Phone"}</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-[#f0f2f5] border-none rounded focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm text-[#667781] mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 bg-[#f0f2f5] border-none rounded focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-[#667781] mb-1">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 bg-[#f0f2f5] border-none rounded focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button 
                type="submit"
                className="w-full bg-[#00a884] hover:bg-[#017561] text-white font-medium py-3 rounded shadow-sm transition-colors mt-4"
              >
                {isRegister ? 'Sign Up' : 'Log In'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Right side illustration/QR placeholder */}
        <div className="hidden md:flex flex-1 bg-[#f0f2f5] items-center justify-center p-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-[#e9edef] rounded-lg flex items-center justify-center bg-white">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-[#e9edef] mx-auto mb-4" />
              <p className="text-[#667781] text-sm">End-to-end encrypted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
