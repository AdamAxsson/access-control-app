import React, { createContext, useState, useContext, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  user: string | null;
  role: 'admin' | 'user' | null;
  login: (username: string, password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', { username, password });
      const { user } = response.data;
      setUser(user.username);
      setRole(user.role);
    } catch (error) {
      alert('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
