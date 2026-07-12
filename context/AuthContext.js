import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { connectSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext(null);

// בודק אם טוקן תקף (חתום כמו שצריך + לא פג תוקף)
function isTokenValid(stored) {
  try {
    const decoded = jwtDecode(stored);
    if (!decoded?.exp) 
      return true; // אין exp בטוקן - לא ניתן לבדוק, נניח שתקף
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false; // טוקן פגום/לא ניתן לפענוח
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const stored = await SecureStore.getItemAsync('token');
      if (stored && isTokenValid(stored)) {
        setToken(stored);
        const decoded = jwtDecode(stored);
        setUserId(decoded.username);
        connectSocket(stored);
      } else if (stored) {
        // טוקן קיים אבל לא תקף (פג תוקף/פגום) - מנקים אותו
        await SecureStore.deleteItemAsync('token');
      }
      setLoading(false);
    };
    init();
  }, []);

  // interceptor גלובלי: אם השרת מחזיר 401 על בקשה כלשהי (טוקן נדחה),
  // מתנתקים אוטומטית במקום להישאר תקועים במסך "מחובר" שכל בקשה בו נכשלת
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401 && logoutRef.current) {
          logoutRef.current();
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  const login = async (newToken) => {
    await SecureStore.setItemAsync('token', newToken);
    setToken(newToken);
    const decoded = jwtDecode(newToken);
    setUserId(decoded.username);
    connectSocket(newToken);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setToken(null);
    setUserId(null);
    disconnectSocket();
  };
  logoutRef.current = logout;

  return (
    <AuthContext.Provider value={{
      token,
      username: userId,
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