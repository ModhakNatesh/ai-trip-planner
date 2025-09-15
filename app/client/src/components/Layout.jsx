import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useAuthStore } from '../store';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Layout = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <MapPin className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl text-gray-900">AI Trip Planner</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  
                  <div className="flex items-center space-x-2">
                    <img
                      src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || user?.email}&background=3b82f6&color=fff`}
                      alt="Profile"
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {user?.displayName || user?.email}
                    </span>
                  </div>

                  <Link to="/settings">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>

                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="space-x-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 AI Trip Planner. Built with React, Node.js, and Firebase.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;