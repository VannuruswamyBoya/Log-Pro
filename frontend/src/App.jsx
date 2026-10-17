import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { UserLogin } from './pages/UserLogin';
import { AdminLogin } from './pages/AdminLogin';
import { UserDashboard } from './pages/UserDashboard';
import { UserHistory } from './pages/UserHistory';
import { UserProfile } from './pages/UserProfile';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminSubmissions } from './pages/AdminSubmissions';
import { AdminUsers } from './pages/AdminUsers';
import { AdminReports } from './pages/AdminReports';
import { AdminSettings } from './pages/AdminSettings';
import { NotFound } from './pages/NotFound';

// Protected Route Guard
const ProtectedRoute = ({ requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400 text-xs">
        Loading Log Pro Workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={requireAdmin ? '/admin/login' : '/login'} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Public Route Guard (Redirect if already logged in)
const PublicRoute = ({ forAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return <Outlet />;
};

// Main Application Layout (Navbar + Sidebar + Content)
const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Body content offset by sidebar width on desktop */}
      <main className="lg:pl-64 pt-4 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all">
        <Outlet />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public authentication portals */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<UserLogin />} />
            </Route>

            <Route element={<PublicRoute forAdmin={true} />}>
              <Route path="/admin/login" element={<AdminLogin />} />
            </Route>

            {/* Protected Employee Routes */}
            <Route element={<ProtectedRoute requireAdmin={false} />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/history" element={<UserHistory />} />
                <Route path="/profile" element={<UserProfile />} />
              </Route>
            </Route>

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route element={<MainLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/submissions" element={<AdminSubmissions />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>

            {/* Root index redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Fallback 404 */}
            <Route element={<MainLayout />}>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
