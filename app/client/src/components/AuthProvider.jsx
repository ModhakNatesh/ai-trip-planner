import { useEffect } from 'react';
import { useAuthStore } from '../store';
import { authService } from '../services/auth';
import { apiService } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

export const AuthProvider = ({ children }) => {
  const { setUser, clearUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (user) {
        // Set basic auth state immediately
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        });

        // Fetch server-side user profile (preferences, saved meta)
        (async () => {
          try {
            const token = await user.getIdToken();
            const res = await apiService.getUser(token);
            if (res?.data?.user) {
              const srv = res.data.user;
              setUser({
                uid: srv.uid || user.uid,
                email: srv.email || user.email,
                displayName: srv.name || srv.displayName || user.displayName,
                photoURL: srv.picture || user.photoURL,
                preferences: srv.preferences || user.preferences || {}
              });
            }
          } catch (err) {
            // If fetching profile fails, keep basic auth info but don't crash
            console.warn('Failed to fetch server user profile:', err);
          }
        })();
      } else {
        clearUser();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, clearUser, setLoading]);

  const value = {
    signUp: authService.signUp.bind(authService),
    signIn: authService.signIn.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signOut: authService.signOut.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};