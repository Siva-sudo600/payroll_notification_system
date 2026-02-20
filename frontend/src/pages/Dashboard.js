import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { payrollAPI, employeeAPI } from '../services/api';
import Sidebar from '../components/Sidebar';

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

export default function Dashboard() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [empStats, setEmpStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Test SMS States
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(
    'Your salary has been calculated successfully. Basic Pay: ₹50,000 | Tax: ₹5,000 | Net Pay: ₹45,000'
  );
  const [smsStatus, setSmsStatus] = useState('');
  const [smsSending, setSmsSending] = useState(false);

  const currentMonth = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const currentDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [payrollRes, empRes] = await Promise.all([
          payrollAPI.getStats(),
          employeeAPI.getStats(),
        ]);
        setStats(payrollRes.data);
        setEmpStats(empRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statusColor = (status) => {
    const map = { initiated: '#3b82f6', calculated: '#f59e0b', processed: '#14b8a6', paid: '#22c55e', failed: '#ef4444' };
    return map[status] || '#94a3b8';
  };

  const sendTestSMS = async () => {
    if (!phone || phone.length !== 10) {
      setSmsStatus('❌ Please enter a valid 10-digit phone number.');
      return;
    }

    setSmsSending(true);
    setSmsStatus('Sending...');

    try {
      const res = await fetch('http://localhost:5000/api/sms/send-test-sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone, message }),
});

      const data = await res.json();

      if (data.success) {
        setSmsStatus('✅ SMS sent successfully!');
      } else {
        setSmsStatus('❌ Failed: ' + data.error);
      }
    } catch (err) {
      setSmsStatus('❌ Error: ' + err.message);
    } finally {
      setSmsSending(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">Dashboard Overview</div>
          </div>
          <div className="topbar-right">
            <div className="topbar-date">{currentDate}</div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/payroll/process')}>
              ▶ Process Payroll
            </button>
          </div>
        </div>

        <div className="page-content">
          {/* Welcome Banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--navy-700), var(--navy-800))',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 28px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-glow-amber)',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white' }}>
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {admin?.name?.split(' ')[0]} 👋
              </div>
              <div style={{ color: 'var(--slate-400)', fontSize: 14, marginTop: 4 }}>
                Manage and process payroll for <strong style={{ color: 'var(--amber)' }}>{currentMonth}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Employees</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'var(--amber-light)', lineHeight: 1 }}>
                {loading ? '—' : empStats?.total || 0}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card" style={{ '--accent-color': 'var(--amber)' }}>
              <div className="stat-icon">◈</div>
              <div className="stat-value">{loading ? '—' : stats?.totalPayrolls || 0}</div>
              <div className="stat-label">Payrolls This Month</div>
            </div>
            <div className="stat-card" style={{ '--accent-color': 'var(--teal)' }}>
              <div className="stat-icon">✓</div>
              <div className="stat-value">{loading ? '—' : stats?.processed || 0}</div>
              <div className="stat-label">Processed</div>
            </div>
            <div className="stat-card" style={{ '--accent-color': '#f59e0b' }}>
              <div className="stat-icon">⏳</div>
              <div className="stat-value">{loading ? '—' : stats?.pending || 0}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card" style={{ '--accent-color': 'var(--success)' }}>
              <div className="stat-icon">₹</div>
              <div className="stat-value" style={{ fontSize: 22 }}>
                {loading ? '—' : `₹${fmt(stats?.totalPayout)}`}
              </div>
              <div className="stat-label">Total Payout</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Recent Activity */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">⚡ Recent Activity</div>
                  <div className="card-subtitle">Latest payroll operations</div>
                </div>
              </div>
              {loading ? (
                <div className="loading-center">
                  <span className="spinner" />
                  Loading...
                </div>
              ) : stats?.recentActivity?.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">◎</div>
                  <p>No recent activity</p>
                </div>
              ) : (
                <div>
                  {stats?.recentActivity?.map((p, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: i < stats.recentActivity.length - 1 ? '1px solid var(--border)' : 'none'
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: statusColor(p.status),
                        boxShadow: `0 0 8px ${statusColor(p.status)}`,
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: 'white', fontWeight: 600 }}>
                          {p.employeeRef?.name || p.empId}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--slate-400)', fontFamily: 'var(--font-mono)' }}>
                          {p.month} · {p.employeeRef?.department}
                        </div>
                      </div>
                      <span className={`status-badge ${p.status}`}>{p.status}</span>
                      {p.netSalary && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--teal-light)', fontWeight: 600 }}>
                          ₹{fmt(p.netSalary)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Breakdown */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">⊞ Departments</div>
                  <div className="card-subtitle">Employee distribution</div>
                </div>
              </div>
              {loading ? (
                <div className="loading-center"><span className="spinner" /></div>
              ) : (
                <div>
                  {empStats?.byDepartment?.map((dept, i) => {
                    const pct = Math.round((dept.count / empStats.total) * 100);
                    return (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                          <span style={{ color: 'var(--slate-300)' }}>{dept._id}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
                            {dept.count} <span style={{ opacity: 0.5 }}>({pct}%)</span>
                          </span>
                        </div>
                        <div style={{ height: 4, background: 'var(--navy-800)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, var(--amber), var(--teal))`,
                            borderRadius: 2,
                            transition: 'width 0.8s ease',
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 16 }}
                onClick={() => navigate('/payroll/process')}
              >
                ▶ Process New Payroll
              </button>
            </div>
          </div>

          {/* Test SMS Notification */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <div>
                <div className="card-title">📱 Send Test SMS Notification</div>
                <div className="card-subtitle">Verify SMS integration by sending a test message to any phone number</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
              {/* Phone Input */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--slate-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--navy-800)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'white',
                    fontSize: 14,
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Message Input */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--slate-400)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                  Message
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'var(--navy-800)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    color: 'white',
                    fontSize: 13,
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Send Button + Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
              <button
                className="btn btn-primary"
                onClick={sendTestSMS}
                disabled={smsSending}
                style={{ minWidth: 160 }}
              >
                {smsSending ? '⏳ Sending...' : '📤 Send Test SMS'}
              </button>

              {smsStatus && (
                <span style={{
                  fontSize: 14,
                  color: smsStatus.includes('✅') ? 'var(--success)' : smsStatus.includes('Sending') ? 'var(--amber)' : '#ef4444',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {smsStatus}
                </span>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}