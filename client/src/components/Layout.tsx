import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
