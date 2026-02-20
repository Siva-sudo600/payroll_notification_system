import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'register' && form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const fn = mode === 'login' ? authAPI.login : authAPI.register;
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const { data } = await fn(payload);
      login(data.token, data.admin);
      toast.success(mode === 'login' ? `Welcome back, ${data.admin.name}!` : 'Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-mark">Payroll<span>Pro</span></div>
          <div className="auth-logo-sub">Administrator Portal</div>
        </div>

        <h2 className="auth-title">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Sign in to access the payroll dashboard'
            : 'Register to get started with PayrollPro'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                name="name"
                placeholder="John Smith"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-control"
              type="email"
              name="email"
              placeholder="admin@company.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'var(--slate-400)', cursor: 'pointer', fontSize: 14
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-control"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing...</>
              : mode === 'login' ? '🔐 Sign In' : '🚀 Create Account'
            }
          </button>
        </form>

        {mode === 'login' && (
          <div className="alert alert-info" style={{ marginTop: 20 }}>
            <span>💡</span>
            <div>
              <strong>Demo credentials</strong><br />
              Email: admin@techcorp.com &nbsp;|&nbsp; Password: Admin@123
            </div>
          </div>
        )}

        <div className="auth-switch">
          {mode === 'login' ? (
            <>Don't have an account? <a onClick={() => setMode('register')}>Register here</a></>
          ) : (
            <>Already have an account? <a onClick={() => setMode('login')}>Sign in</a></>
          )}
        </div>
      </div>
    </div>
  );
}