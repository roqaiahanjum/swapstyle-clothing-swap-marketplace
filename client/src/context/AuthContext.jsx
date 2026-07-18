import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchProfile } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await fetchProfile();
          setUser(res.data);
        } catch (err) {
          console.error('Error fetching profile with token:', err);
          // Token is invalid, clean up
          localStorage.removeItem('token');
          setUser(null);
          setToken('');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = (userData, jwtToken) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const updateUserProfileState = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUserProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
