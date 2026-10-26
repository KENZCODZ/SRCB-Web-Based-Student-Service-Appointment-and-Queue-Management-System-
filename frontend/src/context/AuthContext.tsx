import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { email?: string; student_id_number?: string; password: string }) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isStudent: boolean;
  isLogoutModalOpen: boolean;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('eduqueue_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('eduqueue_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const closeLogoutModal = () => setIsLogoutModalOpen(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('eduqueue_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.data);
          localStorage.setItem('eduqueue_user', JSON.stringify(res.data));
        } catch (err) {
          localStorage.removeItem('eduqueue_token');
          localStorage.removeItem('eduqueue_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email?: string; student_id_number?: string; password: string }) => {
    const res = await api.login(credentials);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('eduqueue_token', newToken);
    localStorage.setItem('eduqueue_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('eduqueue_token', newToken);
    localStorage.setItem('eduqueue_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      localStorage.removeItem('eduqueue_token');
      localStorage.removeItem('eduqueue_user');
      sessionStorage.clear();
      setUser(null);
      setToken(null);
      setIsLogoutModalOpen(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('eduqueue_user', JSON.stringify(updatedUser));
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getMe();
      updateUser(res.data);
    } catch (e) {
      // Ignore
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshProfile,
        isAuthenticated,
        isAdmin,
        isStaff,
        isStudent,
        isLogoutModalOpen,
        openLogoutModal,
        closeLogoutModal,
      }}
    >
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
