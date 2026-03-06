import { motion } from 'framer-motion';
import { X, Mail, Phone, Info, BadgeCheck } from 'lucide-react';
import { User } from '../types';

interface UserProfileModalProps {
  user: User;
  onClose: () => void;
}

export default function UserProfileModal({ user, onClose }: UserProfileModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-32 bg-slate-100">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 pb-8 -mt-16">
          <div className="flex flex-col items-center">
            <div className="relative">
              <img 
                src={user.avatar_url} 
                alt={user.username} 
                className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-white object-cover"
              />
              {user.verified === 1 && (
                <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-sm">
                  <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500 text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <h2 className="text-2xl font-semibold text-slate-800">{user.username}</h2>
              {user.verified === 1 && (
                <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500 text-white" />
              )}
            </div>
            <p className="text-slate-500 text-sm">{user.role === 'admin' ? 'Administrator' : 'User'}</p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">About</p>
                <p className="text-slate-700 mt-0.5">{user.status || "Hey there! I am using Alpha."}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</p>
                <p className="text-slate-700 mt-0.5">{user.email || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Phone</p>
                <p className="text-slate-700 mt-0.5">{user.phone || "Not provided"}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
