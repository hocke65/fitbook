import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { msalInstance, initializeMsal } from '../services/msalInstance';

const AuthContext = createContext(null);
const AUTH_MODE = process.env.REACT_APP_AUTH_MODE || 'local';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth måste användas inom en AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (AUTH_MODE === 'entra') {
        // Entra ID authentication
        await initializeMsal();
        const account = msalInstance.getActiveAccount();

        if (account) {
          try {
            // Fetch user info from backend using the Entra token
            const response = await api.get('/auth/me');
            setUser(response.data.user);
          } catch (error) {
            console.error('Failed to fetch user:', error);
            // If backend doesn't have user, try to create via entra-login
            try {
              const tokenResponse = await msalInstance.acquireTokenSilent({
                scopes: ['openid', 'profile', 'email'],
                account,
              });
              const loginResponse = await api.post('/auth/entra-login', {
                accessToken: tokenResponse.idToken,
                account: {
                  name: account.name,
                  username: account.username,
                  localAccountId: account.localAccountId,
                },
              });
              setUser(loginResponse.data.user);
            } catch (loginError) {
              console.error('Failed to login with Entra:', loginError);
            }
          }
        }
      } else {
        // Local authentication - check if we have a token in localStorage
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
          } catch (error) {
            console.error('Failed to fetch user:', error);
            localStorage.removeItem('token');
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login with Microsoft Entra ID
  const loginWithEntraId = async (accessToken, account) => {
    try {
      const response = await api.post('/auth/entra-login', {
        accessToken,
        account: {
          name: account.name,
          username: account.username,
          localAccountId: account.localAccountId,
        },
      });
      const { user } = response.data;
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { user, token } = response.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    if (AUTH_MODE === 'entra') {
      msalInstance.logoutPopup().catch(console.error);
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    loading,
    login,
    loginWithEntraId,
    register,
    logout,
    isAdmin,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
