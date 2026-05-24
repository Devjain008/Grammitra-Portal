import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { CONFIG } from '../utils/constants';

const AuthContext = createContext();

const normalizeCategories = (categories) => {
  if (Array.isArray(categories)) return categories;
  if (typeof categories === 'string') {
    return categories.includes(',')
      ? categories.split(',').map(c => c.trim())
      : [categories.trim()];
  }
  return [];
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gramMitra_token') || null);
  const [loading, setLoading] = useState(true);

  // Hydrate user session on load
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (token) {
        try {
          const res = await axios.get(`${CONFIG.API_BASE_URL}/api/auth/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setUser({
            ...res.data,
            name: res.data.fullName,
            categories: normalizeCategories(res.data.categories)
          });
        } catch (error) {
          console.error("Token invalid or expired, logging out:", error.message);
          // Only remove if it failed due toauth issues (like 401 or 403), otherwise might be network error.
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            logout();
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, [token]);

  const login = (userData, jwtToken) => {
    localStorage.setItem('gramMitra_token', jwtToken);
    setToken(jwtToken);
    setUser({
      ...userData,
      name: userData.fullName || userData.name,
      categories: normalizeCategories(userData.categories)
    });
  };

  const logout = () => {
    localStorage.removeItem('gramMitra_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updatedData,
        name: updatedData.fullName || prev.name,
        categories: normalizeCategories(updatedData.categories || prev.categories)
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);