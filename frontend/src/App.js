import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProcessPayroll from './pages/ProcessPayroll';
import PayrollHistory from './pages/PayrollHistory';
import EmployeesPage from './pages/EmployeesPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--navy-950)' }}>
      <div style={{ textAlign: 'center' }}>
        <span className="spinner spinner-lg" />
        <div style={{ marginTop: 16, fontFamily: 'var(--font-mono)', color: 'var(--slate-400)', fontSize: 13 }}>Loading AnnaPay Pro...</div>
      </div>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/payroll/process" element={<ProtectedRoute><ProcessPayroll /></ProtectedRoute>} />
      <Route path="/payroll/history" element={<ProtectedRoute><PayrollHistory /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--navy-800)',
              color: 'white',
              border: '1px solid var(--border)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 14,
              borderRadius: 8,
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: 'var(--navy-950)' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: 'var(--navy-950)' },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}