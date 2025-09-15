import { createContext, useEffect } from 'react';
import { useAuthStore } from '../store';
import { authService } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { setUser, clearUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        });
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