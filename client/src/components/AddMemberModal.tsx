import React, { useState } from 'react';
import { X, Loader2, Mail, Shield } from 'lucide-react';
import api from '../services/api';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (member: any) => void;
  projectId: string;
}

export default function AddMemberModal({ isOpen, onClose, onSuccess, projectId }: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, {
        email,
        role
      });
      onSuccess(data.member);
      onClose();
      setEmail('');
      setRole('member');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member. Make sure the user exists.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Add Team Member</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">User Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                className="input pl-10"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('member')}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                  role === 'member' ? 'border-primary-600 bg-primary-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${role === 'member' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold ${role === 'member' ? 'text-primary-700' : 'text-slate-500'}`}>Member</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                  role === 'admin' ? 'border-primary-600 bg-primary-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${role === 'admin' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <span className={`text-xs font-bold ${role === 'admin' ? 'text-primary-700' : 'text-slate-500'}`}>Admin</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
