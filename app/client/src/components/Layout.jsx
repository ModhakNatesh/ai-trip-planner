import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Settings, LogOut, Compass, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { useAuthStore } from '../store';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Layout = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current page is login or signup
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  
  // Check if current page is dashboard
  const isDashboardPage = location.pathname === '/dashboard';

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      toast.success('Signed out successfully');
      navigate('/');
    } else {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 backdrop-blur-xl shadow-2xl border-b border-purple-500/20">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse"></div>

        {/* Bubble Animation behind nav */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Bubble animation JSX can go here */}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center justify-between w-full">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center gap-3 hover:scale-105 transition-all duration-300 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-r from-cyan-400 to-purple-500 p-2 rounded-xl">
                    <Compass className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="font-black text-2xl bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
                    AI Trip Planner
                  </span>
                </div>
              </Link>

              {/* Back Button on Right */}
              {isAuthPage && (
                <Link to="/" className="ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all duration-300 p-3 flex items-center gap-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">Back</span>
                  </Button>
                </Link>
              )}
            </div>


            {/* Actions */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {!isDashboardPage && (
                    <Link to="/dashboard">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all duration-300 font-semibold px-6 py-2 h-auto backdrop-blur-sm"
                      >
                        Dashboard
                      </Button>
                    </Link>
                  )}

                  <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-2xl border border-white/20 shadow-lg backdrop-blur-sm">
                    <img
                      src={
                        user?.photoURL ||
                        `https://ui-avatars.com/api/?name=${user?.displayName || user?.email}&background=8b5cf6&color=fff&bold=true`
                      }
                      alt="Profile"
                      className="h-9 w-9 rounded-full ring-2 ring-white/30"
                    />
                    <span className="text-sm font-semibold text-white/90 max-w-32 truncate">
                      {user?.displayName || user?.email}
                    </span>
                  </div>

                  <Link to="/settings">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all duration-300 p-3"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="rounded-xl hover:bg-red-500/20 text-white/80 hover:text-red-300 transition-all duration-300 p-3"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                !isAuthPage && (
                  <Link to="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold px-6 py-2 h-auto border-0 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Sign In
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 relative z-10">{children}</main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-t border-purple-500/20 relative z-10">
        {/* Bubble Animation behind footer */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Bubble animation JSX can go here */}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-purple-300 relative z-10">
          <p className="font-medium">&copy; 2025 Ai Trip planner. Built with React, Node.js, and Firebase.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;