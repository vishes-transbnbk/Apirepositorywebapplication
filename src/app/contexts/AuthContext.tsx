import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('api-repo-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('api-repo-users') || '{}');

    if (!users[email]) {
      throw new Error('Invalid credentials');
    }

    if (users[email].password !== password) {
      throw new Error('Invalid credentials');
    }

    const user = { email };
    setUser(user);
    localStorage.setItem('api-repo-user', JSON.stringify(user));
  };

  const signup = async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('api-repo-users') || '{}');

    if (users[email]) {
      throw new Error('User already exists');
    }

    users[email] = { password };
    localStorage.setItem('api-repo-users', JSON.stringify(users));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('api-repo-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
