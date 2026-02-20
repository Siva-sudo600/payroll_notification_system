import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { payrollAPI } from '../services/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n || 0);

export default function PayrollHistory() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', empId: '' });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.empId) params.empId = filter.empId.toUpperCase();
      params.limit = 50;
      const { data } = await payrollAPI.getHistory(params);
      setPayrolls(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-title">Payroll History</div>
          <div className="topbar-right">
            <input
              className="form-control form-control-mono"
              placeholder="Filter by EMP ID"
              value={filter.empId}
              onChange={e => setFilter({ ...filter, empId: e.target.value })}
              style={{ width: 160 }}
            />
            <select
              className="form-control"
              value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}
              style={{ width: 160 }}
            >
              <option value="">All Status</option>
              <option value="initiated">Initiated</option>
              <option value="calculated">Calculated</option>
              <option value="processed">Processed</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="page-content">
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 20 }}>
            <div className="card">
              {loading ? (
                <div className="loading-center">
                  <span className="spinner spinner-lg" />
                  <span>Loading payroll records...</span>
                </div>
              ) : payrolls.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⊟</div>
                  <p>No payroll records found</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Month</th>
                        <th>Gross</th>
                        <th>Net Salary</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th>Payslip</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrolls.map((p) => (
                        <tr
                          key={p._id}
                          onClick={() => setSelected(selected?._id === p._id ? null : p)}
                          style={{ cursor: 'pointer', background: selected?._id === p._id ? 'rgba(245,158,11,0.05)' : '' }}
                        >
                          <td>
                            <div style={{ fontWeight: 600, color: 'white', fontSize: 14 }}>
                              {p.employeeRef?.name || p.empId}
                            </div>
                            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--slate-400)' }}>
                              {p.empId} · {p.employeeRef?.department}
                            </div>
                          </td>
                          <td className="mono">{p.month}</td>
                          <td className="mono">
                            {p.grossEarnings ? `₹${fmt(p.grossEarnings)}` : '—'}
                          </td>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal-light)', fontWeight: 600 }}>
                              {p.netSalary ? `₹${fmt(p.netSalary)}` : '—'}
                            </span>
                          </td>
                          <td className="mono">{p.presentDays || '—'}/{p.totalWorkingDays}</td>
                          <td><span className={`status-badge ${p.status}`}>{p.status}</span></td>
                          <td>
                            {p.payslipGenerated
                              ? <span style={{ color: 'var(--success)', fontSize: 12 }}>✅ Yes</span>
                              : <span style={{ color: 'var(--slate-400)', fontSize: 12 }}>—</span>
                            }
                          </td>
                          <td className="mono" style={{ fontSize: 12, color: 'var(--slate-400)' }}>
                            {new Date(p.createdAt).toLocaleDateString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selected && (
              <div className="card" style={{ position: 'sticky', top: 80, height: 'fit-content' }}>
                <div className="card-header">
                  <div className="card-title">Record Details</div>
                  <button className="modal-close" onClick={() => setSelected(null)}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <DetailRow label="Employee" value={selected.employeeRef?.name || selected.empId} />
                  <DetailRow label="Month" value={selected.month} mono />
                  <DetailRow label="Status" value={<span className={`status-badge ${selected.status}`}>{selected.status}</span>} />
                  <DetailRow label="Present Days" value={`${selected.presentDays} / ${selected.totalWorkingDays}`} mono />
                  {selected.overtimeHours > 0 && <DetailRow label="Overtime Hours" value={`${selected.overtimeHours}h`} mono />}
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                  <DetailRow label="Basic Pay" value={selected.basicPay ? `₹${fmt(selected.basicPay)}` : '—'} mono />
                  <DetailRow label="Gross Earnings" value={selected.grossEarnings ? `₹${fmt(selected.grossEarnings)}` : '—'} mono />
                  <DetailRow label="PF" value={selected.pfAmount ? `- ₹${fmt(selected.pfAmount)}` : '—'} mono deduct />
                  <DetailRow label="Income Tax" value={selected.incomeTax ? `- ₹${fmt(selected.incomeTax)}` : '—'} mono deduct />
                  <DetailRow label="Total Deductions" value={selected.totalDeductions ? `- ₹${fmt(selected.totalDeductions)}` : '—'} mono deduct />
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(20,184,166,0.1), rgba(20,184,166,0.05))',
                    border: '1px solid rgba(20,184,166,0.2)',
                    borderRadius: 'var(--radius)', padding: '12px 14px',
                  }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--teal-light)' }}>Net Salary</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--teal)' }}>
                      {selected.netSalary ? `₹${fmt(selected.netSalary)}` : '—'}
                    </span>
                  </div>
                  {selected.remarks && <DetailRow label="Remarks" value={selected.remarks} />}
                  <DetailRow label="Payslip" value={selected.payslipGenerated ? '✅ Generated' : 'Not generated'} />
                  <DetailRow label="Processed By" value={selected.processedBy} mono />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function DetailRow({ label, value, mono, deduct }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <span style={{ color: 'var(--slate-400)' }}>{label}</span>
      <span style={{
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        color: deduct ? 'var(--danger)' : 'var(--slate-200)',
        fontWeight: 500
      }}>
        {value || '—'}
      </span>
    </div>
  );
}