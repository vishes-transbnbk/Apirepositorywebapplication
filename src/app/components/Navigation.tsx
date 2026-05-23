import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Database, LogOut } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Database size={28} className="text-blue-600" />
              <span className="text-xl font-bold text-slate-900">API Repository</span>
            </div>

            <div className="flex gap-1">
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/view"
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  isActive('/view')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                View APIs
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition-colors font-medium"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
