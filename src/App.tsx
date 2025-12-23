import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Explore from './pages/Explore';
import GroupDetail from './pages/groups/GroupDetail';
import Create from './pages/Create';
import Profile from './pages/Profile';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPasswordConfirm from './pages/auth/ResetPasswordConfirm';
import ProtectedRoute from './routes/ProtectedRoute';
import Toasts from './components/Toasts';
import './lib/i18n';
import Home from './pages/Home';
import Schedule from './pages/groups/Schedule';
import DirectChat from './pages/dm/DirectChat';
import { DMProvider } from './hooks/useDM';
import DMFloating from './components/DMFloating';
import Dashboard from './pages/admin/Dashboard';
import AdminLayout from './components/AdminLayout';
import UserManagement from './pages/admin/UserManagement';
import ActivityManagement from './pages/admin/ActivityManagement';
import ReportManagement from './pages/admin/ReportManagement';

export default function App() {
  return (
    <DMProvider>
      <Routes>
        {/* Admin Routes - Separate Layout without Navbar */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="activities" element={<ActivityManagement />} />
          <Route path="reports" element={<ReportManagement />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Main App Routes with Navbar */}
        <Route
          path="/*"
          element={
            // ปรับปรุง: เปลี่ยน bg-slate-100 เป็น bg-slate-200 
            // หรือใช้ bg-light-bg (จาก config ที่แก้ด้านล่าง) เพื่อลดความสว่างจ้า
            <div className="min-h-screen bg-light-bg dark:bg-primary-900 transition-colors duration-200">
              <Navbar />
              <main className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<Explore />} />

                  <Route
                    path="/groups/:id"
                    element={
                      <ProtectedRoute>
                        <GroupDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/groups/:id/schedule"
                    element={
                      <ProtectedRoute>
                        <Schedule />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/create"
                    element={
                      <ProtectedRoute>
                        <Create />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/dm/:uid"
                    element={
                      <ProtectedRoute>
                        <DirectChat />
                      </ProtectedRoute>
                    }
                  />

                  {/* Auth Routes with Navbar */}
                  <Route path="/auth/signin" element={<SignIn />} />
                  <Route path="/auth/signup" element={<SignUp />} />
                  <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                  <Route path="/auth/reset" element={<ResetPasswordConfirm />} />

                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
              <DMFloating />
              <Toasts />
            </div>
          }
        />
      </Routes>
    </DMProvider>
  );
}