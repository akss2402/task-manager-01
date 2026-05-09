import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../store/authStore';
import { format } from 'date-fns';

import CreateProjectModal from '../components/CreateProjectModal';


interface Stats {
  statusCounts: Record<string, number>;
  overdueCount: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/my-tasks?limit=5')
        ]);
        setStats(statsRes.data);
        setTasks(tasksRes.data.tasks);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { 
      id: 'todo',
      label: 'To Do', 
      value: stats?.statusCounts['todo'] || 0, 
      icon: Clock, 
      color: 'bg-slate-400',
      shadow: 'shadow-slate-200'
    },
    { 
      id: 'in_progress',
      label: 'In Progress', 
      value: stats?.statusCounts['in_progress'] || 0, 
      icon: Clock, 
      color: 'bg-amber-500',
      shadow: 'shadow-amber-200'
    },
    { 
      id: 'done',
      label: 'Completed', 
      value: stats?.statusCounts['done'] || 0, 
      icon: CheckCircle2, 
      color: 'bg-emerald-500',
      shadow: 'shadow-emerald-200'
    },
    { 
      id: 'overdue',
      label: 'Overdue', 
      value: stats?.overdueCount || 0, 
      icon: AlertCircle, 
      color: 'bg-red-500',
      shadow: 'shadow-red-200'
    },
  ];

  const handleDeleteTask = async (projectId: string, taskId: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
      const { data } = await api.get('/dashboard/overview');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (projectId: string, taskId: string, newStatus: string) => {
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/projects/${projectId}/tasks/${taskId}`, { status: newStatus });
      const { data } = await api.get('/dashboard/overview');
      setStats(data);
    } catch (err) {
      console.error(err);
      setTasks(previousTasks);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Here's an overview of your active assignments.</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setIsProjectModalOpen(true)} className="btn btn-primary shadow-xl shadow-primary-200">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <button 
            key={stat.label} 
            onClick={() => navigate('/tasks')}
            className="card p-6 flex items-center gap-5 hover:border-primary-200 transition-all hover:shadow-xl hover:shadow-slate-200/50 text-left group animate-scale-in"
          >
            <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg ${stat.shadow}/50 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-6 h-6 ${stat.id === 'in_progress' ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 leading-tight">{stat.value}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Recent Assignments
              <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                Last 5
              </span>
            </h2>
            <Link to="/tasks" className="text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="card border-none shadow-xl shadow-slate-200/50 divide-y divide-slate-50">
            {tasks.length > 0 ? tasks.map((task) => (
              <div key={task.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                <div className="flex items-center gap-5">
                  <div className={`w-3 h-3 rounded-full shadow-sm ${
                    task.status === 'done' ? 'bg-emerald-500' : 
                    task.status === 'in_progress' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
                  }`} />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors leading-snug">{task.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        Due {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No Date'}
                      </p>
                      <span className="text-slate-200">•</span>
                      <p className="text-[10px] font-black text-primary-500 uppercase tracking-tighter">
                        ID: {task.project_id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <select 
                    className={`text-[10px] font-black uppercase rounded-lg px-2.5 py-1.5 border-none focus:ring-0 cursor-pointer transition-all ${
                      task.priority === 'high' ? 'bg-red-50 text-red-600' :
                      task.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                    }`}
                    value={task.priority}
                    disabled={user?.role !== 'admin'}
                    onChange={async (e) => {
                      try {
                        await api.patch(`/projects/${task.project_id}/tasks/${task.id}`, { priority: e.target.value });
                        setTasks(tasks.map(t => t.id === task.id ? { ...t, priority: e.target.value } : t));
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    <option value="low">LOW</option>
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                  </select>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleDeleteTask(task.project_id, task.id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <Link 
                      to={`/projects/${task.project_id}`} 
                      className="p-2 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-xl transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-16 text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No recent assignments.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-8 text-center border-none shadow-xl shadow-slate-200/50 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Project Stats</h3>
            <p className="text-primary-100 text-xs font-medium leading-relaxed mb-6">
              {user?.role === 'admin' 
                ? "You are currently managing multiple projects with your team."
                : "You will see your assignments here once you are added to a project."}
            </p>
            <button 
              onClick={() => navigate('/projects')}
              className="w-full py-3 bg-white text-primary-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-50 transition-colors"
            >
              {user?.role === 'admin' ? "Manage Projects" : "View Projects"}
            </button>
          </div>
        </div>
      </div>

      <CreateProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        onSuccess={(p) => navigate(`/projects/${p.id}`)} 
      />
    </div>
  );
}

