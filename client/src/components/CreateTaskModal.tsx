import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../store/authStore';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: any) => void;
  projectId?: string; // Optional if we are on a project page
}

export default function CreateTaskModal({ isOpen, onClose, onSuccess, projectId: initialProjectId }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId || '');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { user: globalUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = globalUser?.role === 'admin';

  useEffect(() => {
    if (isOpen && !initialProjectId) {
      // Fetch projects to populate dropdown
      api.get('/projects').then(({ data }) => setProjects(data.projects)).catch(console.error);
    }
  }, [isOpen, initialProjectId]);

  useEffect(() => {
    if (initialProjectId) setProjectId(initialProjectId);
  }, [initialProjectId]);

  useEffect(() => {
    if (isOpen) {
      console.log('Fetching users for modal. User role:', globalUser?.role);
      api.get('/users')
        .then(({ data }) => {
          console.log('All organization users:', data.users);
          setMembers(data.users);
        })
        .catch(err => {
          console.error('Failed to fetch users:', err);
          // Fallback to project members if global fetch fails
          if (projectId) {
            api.get(`/projects/${projectId}/members`)
              .then(({ data }) => setMembers(data.members))
              .catch(console.error);
          }
        });
    }
  }, [isOpen, projectId, globalUser?.role]);


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError('Please select a project');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`/projects/${projectId}/tasks`, {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assigneeId: assigneeId || null
      });
      onSuccess(data.task);
      onClose();
      // Reset
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssigneeId('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Add New Task</h2>
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

          {!initialProjectId && (
            <div>
              <label className="label">Project</label>
              <select 
                className="input" 
                value={projectId} 
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                <option value="">Select a project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Task Title</label>
            <input
              type="text"
              required
              className="input"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Description (Optional)</label>
            <textarea
              rows={2}
              className="input"
              placeholder="Add some details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Assignee (Optional)</label>
            <select className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Select an assignee</option>
              {members.map(m => (
                <option key={m.id || m.user_id} value={m.id || m.user_id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Due Date (Optional)</label>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>


          <div className="flex items-center gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
