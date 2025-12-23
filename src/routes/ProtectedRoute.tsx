// apps/frontend/src/routes/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <section className="container-app py-8 min-h-screen flex items-center justify-center">
        <div className="card p-6 text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-lg">กำลังโหลด...</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace state={{ from: loc }} />;
  }

  return <>{children}</>;
}
