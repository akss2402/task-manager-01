import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Loader2,
  MoreVertical,
  Trash2,
  AlertCircle
} from 'lucide-react';

import api from '../services/api';
import { useAuth } from '../store/authStore';
import { format } from 'date-fns';
import CreateTaskModal from '../components/CreateTaskModal';
import AddMemberModal from '../components/AddMemberModal';



interface Project {
  id: string;
  name: string;
  description: string;
}

interface Member {
  user_id: string;
  name: string;
  email: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id?: string | null;
  assignee_name?: string;
  due_date: string | null;
}


export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user: globalUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  const isAdmin = globalUser?.role === 'admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, mRes, tRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/members`),
          api.get(`/projects/${projectId}/tasks`)
        ]);
        setProject(pRes.data.project);
        setMembers(mRes.data.members);
        setTasks(tRes.data.tasks);
      } catch (e: any) {
        console.error(e);
        setError(e.response?.data?.message || 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchData();
  }, [projectId]);

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.patch(`/projects/${projectId}/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      console.error(err);
      // Revert on error
      setTasks(previousTasks);
      alert('Failed to update task status. Please try again.');
    }
  };


  const handlePriorityUpdate = async (taskId: string, newPriority: string) => {
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));

    try {
      await api.patch(`/projects/${projectId}/tasks/${taskId}`, { priority: newPriority });
    } catch (err) {
      console.error(err);
      // Revert on error
      setTasks(previousTasks);
      alert('Failed to update priority. Please try again.');
    }
  };


  const handleDeleteTask = async (taskId: string) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, status: string) => {
    const taskId = e.dataTransfer.getData('taskId');
    handleStatusUpdate(taskId, status);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto mt-20 animate-scale-in">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Oops! Something went wrong</h2>
        <p className="text-slate-500 mb-8">{error || 'Project not found'}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link to="/projects" className="text-slate-400 hover:text-slate-600 transition-colors">
              Projects
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-medium">Board</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project?.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-primary-600 text-white shadow-md shadow-primary-200' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Board
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'members' ? 'bg-primary-600 text-white shadow-md shadow-primary-200' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Team
            </button>
          </div>
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </button>
          )}
        </div>
      </header>

      {activeTab === 'tasks' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['todo', 'in_progress', 'done'] as const).map((status) => (
            <div 
              key={status} 
              className="kanban-column"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, status)}
            >
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`status-indicator status-${status.replace('_', '-')}`} />
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                    {status.replace('_', ' ')}
                  </h3>
                </div>
                <span className="text-xs font-black text-slate-400 bg-white/80 px-2 py-0.5 rounded-full shadow-sm">
                  {tasks.filter(t => t.status === status).length}
                </span>
              </div>
              
              <div className="space-y-4">
                {tasks.filter(t => t.status === status).map((task) => (
                  <div 
                    key={task.id} 
                    className="task-card group animate-scale-in"
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <select 
                        className={`text-[10px] font-black uppercase rounded-lg px-2 py-1 border-none focus:ring-0 cursor-pointer transition-all ${
                          task.priority === 'high' ? 'bg-red-50 text-red-600 hover:bg-red-100' :
                          task.priority === 'medium' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-200'
                        }`}
                        value={task.priority}
                        onChange={(e) => handlePriorityUpdate(task.id, e.target.value)}
                      >
                        <option value="low">LOW</option>
                        <option value="medium">MEDIUM</option>
                        <option value="high">HIGH</option>
                      </select>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mb-2 leading-snug group-hover:text-primary-600 transition-colors">
                      {task.title}
                    </h4>
                    
                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {task.assignee_id ? (
                          <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-[10px] text-white font-bold" title={task.assignee_name}>
                            {task.assignee_name?.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <Users className="w-3 h-3" />
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No Date'}
                        </span>
                      </div>
                      
                      <select 
                        className="text-[10px] font-black uppercase bg-transparent border-none p-0 text-slate-400 focus:ring-0 cursor-pointer hover:text-primary-600"
                        value={task.status}
                        onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                      >
                        <option value="todo">TODO</option>
                        <option value="in_progress">PROGRESS</option>
                        <option value="done">DONE</option>
                      </select>
                    </div>
                  </div>
                ))}
                
                {isAdmin && (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 animate-scale-in">
          <div className="p-4 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Project Team</h3>
            {isAdmin && (
              <button onClick={() => setIsMemberModalOpen(true)} className="btn btn-primary text-xs py-1.5 px-3">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Invite
              </button>
            )}
          </div>
          {members.map((member) => (
            <div key={member.user_id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg border-2 border-white shadow-sm">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{member.name}</h3>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  member.role === 'admin' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                }`}>
                  {member.role}
                </span>
                {isAdmin && (
                  <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={(t) => setTasks([t, ...tasks])} 
        projectId={projectId}
      />

      <AddMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSuccess={(m) => setMembers([...members, m])}
        projectId={projectId!}
      />
    </div>
  );
}
