import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ApiProvider } from './contexts/ApiContext';
import { Toaster } from 'sonner';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import ViewPage from './components/ViewPage';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/view"
        element={
          <ProtectedRoute>
            <ViewPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ApiProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </ApiProvider>
      </AuthProvider>
    </Router>
  );
}