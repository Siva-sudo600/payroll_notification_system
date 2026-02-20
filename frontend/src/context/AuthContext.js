import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('payroll_token');
    const savedAdmin = localStorage.getItem('payroll_admin');
    if (savedToken && savedAdmin) {
      setToken(savedToken);
      setAdmin(JSON.parse(savedAdmin));
    }
    setLoading(false);
  }, []);

  const login = (tokenVal, adminData) => {
    localStorage.setItem('payroll_token', tokenVal);
    localStorage.setItem('payroll_admin', JSON.stringify(adminData));
    setToken(tokenVal);
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('payroll_token');
    localStorage.removeItem('payroll_admin');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);