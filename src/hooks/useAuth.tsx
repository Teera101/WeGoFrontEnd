import { useContext, createContext, useState, useEffect } from 'react';
import { api } from '../lib/apiClient';

interface User {
  _id: string;
  email: string;
  username?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  logOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user; // Return user object so SignIn can check role
  };

  const signUp = async (email: string, password: string, username?: string) => {
    const payload: any = { email, password };
    if (username) {
      payload.username = username;
    }
    const response = await api.post('/auth/register', payload);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    setUser(user);
  };

  const logOut = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/auth/signin';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
