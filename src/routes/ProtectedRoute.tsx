import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="card p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-center shadow-lg min-w-[300px]">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">กำลังโหลด...</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace state={{ from: loc }} />;
  }

  return <>{children}</>;
}