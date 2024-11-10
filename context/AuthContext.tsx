import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; email: string } | null;
  login: (user: { id: string; email: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  // Load user session from AsyncStorage when the app starts
  useEffect(() => {
    const loadSession = async () => {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    };
    loadSession();
  }, []);

  // Login and save session to AsyncStorage
  const login = async (user: { id: string; email: string }) => {
    const completeUser = { ...user }; // add defaults
    setIsAuthenticated(true);
    setUser(completeUser);
    await AsyncStorage.setItem('user', JSON.stringify(completeUser)); // Save user session
  };

  // Logout and clear session from AsyncStorage
  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    await AsyncStorage.removeItem('user'); // Clear user session
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
