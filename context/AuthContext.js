import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { connectSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const stored = await SecureStore.getItemAsync('token');
      if (stored) {
        setToken(stored);
        const decoded = jwtDecode(stored);
        setUserId(decoded.id);
        connectSocket(stored);
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (newToken) => {
    await SecureStore.setItemAsync('token', newToken);
    setToken(newToken);
    const decoded = jwtDecode(newToken);
    setUserId(decoded.id);
    connectSocket(newToken);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setToken(null);
    setUserId(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{
      token,
      userId,
      isAuthenticated: !!token,
      login,
      logout,
      loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}