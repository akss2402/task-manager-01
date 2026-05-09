import { useEffect, useState } from 'react';
import { 
  CheckSquare,  
  Search, 
  Clock, 
  CheckCircle2, 
  Trash2,
  Loader2,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';

// import CreateTaskModal from '../components/CreateTaskModal';


interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  project_id: string;
}

export default function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  // const [isModalOpen, setIsModalOpen] = useState(false);


  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await api.get('/dashboard/my-tasks');
        setTasks(data.tasks);
      } catch (e) {
        console.error(e);
        setError('Failed to fetch assignments');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleDeleteTask = async (projectId: string, taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (projectId: string, taskId: string, newStatus: string) => {
    const prev = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
    try {
      await api.patch(`/projects/${projectId}/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      console.error(err);
      setTasks(prev);
    }
  };

  const handlePriorityUpdate = async (projectId: string, taskId: string, newPriority: string) => {
    const prev = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, priority: newPriority as any } : t));
    try {
      await api.patch(`/projects/${projectId}/tasks/${taskId}`, { priority: newPriority });
    } catch (err) {
      console.error(err);
      setTasks(prev);
    }
  };

  const filteredTasks = tasks.filter(t => statusFilter === 'all' || t.status === statusFilter);

  const stats = [
    { id: 'todo', label: 'Todo', count: tasks.filter(t => t.status === 'todo').length, icon: Clock, color: 'bg-slate-400', bgColor: 'bg-slate-50' },
    { id: 'in_progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length, icon: Clock, color: 'bg-amber-500', bgColor: 'bg-amber-50' },
    { id: 'done', label: 'Completed', count: tasks.filter(t => t.status === 'done').length, icon: CheckCircle2, color: 'bg-emerald-500', bgColor: 'bg-emerald-50' }
  ];

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Assignments</h1>
          <p className="text-slate-500 mt-1">Everything assigned to you across all active projects.</p>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <button 
            key={stat.id} 
            onClick={() => setStatusFilter(stat.id)}
            className={`p-6 rounded-2xl flex items-center gap-5 border-2 transition-all group text-left ${
              statusFilter === stat.id 
                ? 'border-primary-500 bg-white shadow-lg shadow-primary-100 scale-[1.02]' 
                : 'border-transparent bg-white shadow-sm hover:border-slate-200 hover:shadow-md'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-current/20 ${stat.color} transition-transform group-hover:scale-110`}>
              <stat.icon className={`w-6 h-6 ${stat.id === 'in_progress' ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 leading-tight">{stat.count}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="card border-none shadow-xl shadow-slate-200/50">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" className="input pl-10 border-transparent bg-white focus:bg-white" placeholder="Filter tasks..." />
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${statusFilter === 'all' ? 'bg-primary-600 text-white shadow-md shadow-primary-200' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All
            </button>
            {stats.map(s => (
              <button 
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${statusFilter === s.id ? 'bg-primary-600 text-white shadow-md shadow-primary-200' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {s.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignment</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTasks.length > 0 ? filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors leading-tight mb-1">{task.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Project ID: {task.project_id.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <select 
                      className={`text-[10px] font-black uppercase rounded-lg px-2.5 py-1.5 border-none focus:ring-0 cursor-pointer transition-all ${
                        task.status === 'done' ? 'bg-emerald-50 text-emerald-600' : 
                        task.status === 'in_progress' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                      }`}
                      value={task.status}
                      onChange={(e) => handleStatusUpdate(task.project_id, task.id, e.target.value)}
                    >
                      <option value="todo">TODO</option>
                      <option value="in_progress">PROGRESS</option>
                      <option value="done">DONE</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <select 
                      className={`text-[10px] font-black uppercase rounded-lg px-2.5 py-1.5 border-none focus:ring-0 cursor-pointer transition-all ${
                        task.priority === 'high' ? 'bg-red-50 text-red-600' :
                        task.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                      }`}
                      value={task.priority}
                      onChange={(e) => handlePriorityUpdate(task.project_id, task.id, e.target.value)}
                    >
                      <option value="low">LOW</option>
                      <option value="medium">MEDIUM</option>
                      <option value="high">HIGH</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">
                        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No date'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDeleteTask(task.project_id, task.id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center animate-scale-in">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <CheckSquare className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Assignments Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

