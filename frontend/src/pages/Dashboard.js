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

  // Email states
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPassword, setSenderPassword] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState('Your payroll processing for this month has been started.');
  const [emailStatus, setEmailStatus] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');

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

  const sendTestEmail = async () => {
    if (!senderEmail || !senderPassword || !recipientEmail) {
      setEmailStatus('❌ Please fill all fields');
      return;
    }
    setEmailSending(true);
    setEmailStatus('Sending...');
    try {
      const res = await fetch('http://localhost:5000/api/mail/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderEmail,
          senderPassword,
          recipientEmail,
          subject: 'AnnaPay Pro Test Notification',
          message: emailMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('payroll_sender_email', senderEmail);
        localStorage.setItem('payroll_sender_password', senderPassword);
        setEmailStatus('✅ Email sent! Credentials saved for payroll notifications.');
      } else {
        setEmailStatus('❌ Failed: ' + data.error);
      }
    } catch (err) {
      setEmailStatus('❌ Error: ' + err.message);
    } finally {
      setEmailSending(false);
    }
  };

  const handleProcessPayroll = () => {
    if (!senderEmail || !senderPassword) {
      setEmailStatus('❌ Please fill sender email and app password');
      return;
    }
    if (!recipientEmail) {
      setEmailStatus('❌ Please enter recipient email');
      return;
    }
    if (!selectedEmpId) {
      setEmailStatus('❌ Please select an Employee ID');
      return;
    }
    // Save everything to localStorage
    localStorage.setItem('payroll_sender_email', senderEmail);
    localStorage.setItem('payroll_sender_password', senderPassword);
    localStorage.setItem('payroll_recipient_email', recipientEmail);
    localStorage.setItem('payroll_emp_id', selectedEmpId);
    // Navigate to process payroll
    navigate('/payroll/process');
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
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {admin?.name?.split(' ')[0]} 
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
                <div className="loading-center"><span className="spinner" />Loading...</div>
              ) : stats?.recentActivity?.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">◎</div>
                  <p>No recent activity</p>
                </div>
              ) : (
                <div>
                  {stats?.recentActivity?.map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                      borderBottom: i < stats.recentActivity.length - 1 ? '1px solid var(--border)' : 'none'
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(p.status), boxShadow: `0 0 8px ${statusColor(p.status)}`, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: 'white', fontWeight: 600 }}>{p.employeeRef?.name || p.empId}</div>
                        <div style={{ fontSize: 11, color: 'var(--slate-400)', fontFamily: 'var(--font-mono)' }}>{p.month} · {p.employeeRef?.department}</div>
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
                          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, var(--amber), var(--teal))`, borderRadius: 2, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Email Notification + Process Payroll Card ── */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <div>
                <div className="card-title">📧 Email Notification & Process Payroll</div>
                <div className="card-subtitle">Fill all details below to send notifications and process payroll</div>
              </div>
            </div>

            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              <span>💡</span>
              <div>
                For demo testing, use sender gmail as <strong>"mageshgumar5@gmail.com"</strong> and password as <strong>"wrxd tsyt ybyu dlde"</strong> (without quotes). The recipient email is any valid email id that you have.
              </div>
            </div>

            {/* Row 1: Sender Gmail + App Password */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Sender Gmail</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                />
                 <div className="form-hint">Enter gmail given above</div>
              </div>
              <div className="form-group">
                <label className="form-label">App Password</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={senderPassword}
                  onChange={e => setSenderPassword(e.target.value)}
                />
                <div className="form-hint">Enter demo password given above</div>
              </div>
            </div>

            {/* Row 2: Recipient Email + Employee ID */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Recipient Email</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="recipient@gmail.com"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                />
                <div className="form-hint">Payroll notifications will be sent to this email</div>
              </div>
              <div className="form-group">
                <label className="form-label">Select Employee</label>
                <select
                  className="form-control"
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                >
                  <option value="">-- Select Employee ID --</option>
                  {['EMP001','EMP002','EMP003','EMP004','EMP005','EMP006','EMP007','EMP008'].map(id => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
                <div className="form-hint">Employee whose payroll will be processed</div>
              </div>
            </div>

            {/* Row 3: Test Message */}
            <div className="form-group">
              <label className="form-label">Test Message</label>
              <input
                className="form-control"
                placeholder="Test payroll notification message"
                value={emailMessage}
                onChange={e => setEmailMessage(e.target.value)}
              />
            </div>

            {/* Buttons Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <button
                className="btn btn-outline"
                onClick={sendTestEmail}
                disabled={emailSending}
              >
                {emailSending ? '⏳ Sending...' : '📧 Send Test Email'}
              </button>

              <button
                className="btn btn-primary btn-lg"
                onClick={handleProcessPayroll}
              >
                ▶ Process Payroll
              </button>

              {emailStatus && (
                <span style={{
                  fontSize: 14,
                  color: emailStatus.includes('✅') ? 'var(--success)' : emailStatus.includes('Sending') ? 'var(--amber)' : 'var(--danger)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {emailStatus}
                </span>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}