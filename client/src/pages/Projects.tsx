import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  MoreVertical, 
  Users, 
  Calendar,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../store/authStore';
import { format } from 'date-fns';
import CreateProjectModal from '../components/CreateProjectModal';


interface Project {
  id: string;
  name: string;
  description: string;
  member_count: number;
  created_at: string;
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAdmin = user?.role === 'admin';


  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get('/projects');
        setProjects(data.projects);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and track all your active team projects.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary shadow-xl shadow-primary-200">
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </button>
        )}
      </header>


      <div className="relative group max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
        </div>
        <input
          type="text"
          className="input pl-10 border-transparent bg-white shadow-sm focus:bg-white focus:shadow-md"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div key={project.id} className="card group hover:border-primary-300 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-100/50 animate-scale-in border-none shadow-lg shadow-slate-200/50">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-200 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-7 h-7" />
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors tracking-tight">
                  {project.name}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-8 min-h-[40px] leading-relaxed">
                  {project.description || 'No description provided for this project.'}
                </p>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{project.member_count || 1} Team</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {project.created_at ? format(new Date(project.created_at), 'MMM d') : 'New'}
                      </span>
                    </div>
                  </div>
                  <Link 
                    to={`/projects/${project.id}`}
                    className="text-primary-600 hover:text-white p-3 hover:bg-primary-600 rounded-2xl transition-all shadow-sm hover:shadow-lg hover:shadow-primary-200"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-20 text-center border-none shadow-xl shadow-slate-200/50 animate-scale-in">
          <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-12 h-12 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">No projects found</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto font-medium leading-relaxed">
            {isAdmin 
              ? "Try adjusting your search or create a new project to get started." 
              : "You are not a member of any projects yet. Please ask an administrator to add you."}
          </p>
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary mt-8 shadow-lg shadow-primary-200">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Project
            </button>
          )}
        </div>
      )}

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={(p) => setProjects([p, ...projects])} 
      />
    </div>
  );
}


