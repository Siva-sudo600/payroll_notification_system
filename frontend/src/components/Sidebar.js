import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { icon: '⬡', label: 'Dashboard', path: '/dashboard' },
  { icon: '⊞', label: 'Process Payroll', path: '/payroll/process' },
  { icon: '⊟', label: 'Payroll History', path: '/payroll/history' },
  { icon: '◎', label: 'Employees', path: '/employees' },
];

export default function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div style={{ fontSize: 20, fontWeight: 2000 }}>
  Anna Pay<span style={{ color: 'var(--amber)' }}> Pro</span>
</div>
        </div>
        <div className="logo-subtitle">Admin Dashboard</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="admin-card">
          <div className="admin-avatar">{getInitials(admin?.name)}</div>
          <div className="admin-info">
            <div className="admin-name">{admin?.name || 'Admin'}</div>
            <div className="admin-role">Administrator</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">⇥</button>
        </div>
      </div>
    </aside>
  );
}