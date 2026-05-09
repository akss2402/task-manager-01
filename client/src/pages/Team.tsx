import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Shield, 
  Clock, 
  CheckCircle2, 
  MoreVertical,
  Loader2,
  TrendingUp,
  Activity
} from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';

interface UserStats {
  total_tasks: number;
  completed_tasks: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  created_at: string;
  stats: UserStats;
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data } = await api.get('/users');
        setMembers(data.users);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Team Members</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your organization and track individual performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
             <div className="px-4 py-2 text-xs font-black uppercase text-slate-400">
               {members.length} Total Users
             </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-md group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search members by name or email..." 
          className="input pl-10 border-transparent bg-white shadow-sm focus:bg-white focus:shadow-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMembers.map((member) => (
          <div key={member.id} className="card group hover:border-primary-300 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-100/50 animate-scale-in border-none shadow-lg shadow-slate-200/50 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-2xl font-black shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-white shadow-sm ${member.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-emerald-500 text-white'}`}>
                    {member.role === 'admin' ? <Shield className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                  </div>
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <MoreVertical className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors">{member.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{member.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-slate-700">
                      {member.stats.total_tasks > 0 
                        ? Math.round((member.stats.completed_tasks / member.stats.total_tasks) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-bold text-slate-700">{member.stats.completed_tasks}/{member.stats.total_tasks}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Joined {format(new Date(member.created_at), 'MMM yyyy')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredMembers.length === 0 && (
        <div className="card p-20 text-center border-none shadow-xl shadow-slate-200/50 animate-scale-in">
          <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">No members found</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto font-medium leading-relaxed">
            Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
