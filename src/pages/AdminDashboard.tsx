import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Trash2, Edit2, X, Check, ArrowLeft } from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<any>>({});

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

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admin only.</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      <div className="bg-[#00a884] p-4 flex items-center gap-4 text-white shadow-md">
        <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Shield className="w-6 h-6" />
        <h1 className="text-xl font-semibold">Admin Dashboard - Account Manager</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading users...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-medium text-slate-600">User</th>
                  <th className="p-4 font-medium text-slate-600">Contact</th>
                  <th className="p-4 font-medium text-slate-600">Role</th>
                  <th className="p-4 font-medium text-slate-600">Joined</th>
                  <th className="p-4 font-medium text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full bg-slate-200" />
                        {editingId === u.id ? (
                          <input 
                            type="text" 
                            className="border border-slate-300 rounded px-2 py-1 text-sm w-32"
                            value={editForm.username}
                            onChange={e => setEditForm({...editForm, username: e.target.value})}
                          />
                        ) : (
                          <span className="font-medium text-slate-800">{u.username}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {editingId === u.id ? (
                        <div className="space-y-1">
                          <input 
                            type="text" 
                            placeholder="Email"
                            className="border border-slate-300 rounded px-2 py-1 text-sm w-full block"
                            value={editForm.email}
                            onChange={e => setEditForm({...editForm, email: e.target.value})}
                          />
                          <input 
                            type="text" 
                            placeholder="Phone"
                            className="border border-slate-300 rounded px-2 py-1 text-sm w-full block"
                            value={editForm.phone}
                            onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-slate-600">
                          <div>{u.email || '-'}</div>
                          <div className="text-slate-400">{u.phone || '-'}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === u.id ? (
                        <select 
                          className="border border-slate-300 rounded px-2 py-1 text-sm"
                          value={editForm.role}
                          onChange={e => setEditForm({...editForm, role: e.target.value})}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {editingId === u.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleSave(u.id)} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {u.id !== user?.id && (
                            <button onClick={() => handleDelete(u.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
