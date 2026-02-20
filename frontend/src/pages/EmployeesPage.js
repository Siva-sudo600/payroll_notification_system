import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { employeeAPI } from '../services/api';

const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    employeeAPI.getAll().then(({ data }) => {
      setEmployees(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const departments = [...new Set(employees.map(e => e.department))];

  const filtered = employees.filter(e => {
    const matchSearch = !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.empId.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const gross = (e) => e.basicPay + e.hra + e.da + e.ta + e.medicalAllowance + e.specialAllowance;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div className="topbar-title">Employees</div>
          <div className="topbar-right">
            <input
              className="form-control"
              placeholder="Search by name, ID or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
            <select
              className="form-control"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              style={{ width: 160 }}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="page-content">
          {loading ? (
            <div className="loading-center">
              <span className="spinner spinner-lg" />
              <span>Loading employees...</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20 }}>
              {/* Employee Grid */}
              <div>
                <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--slate-400)', fontFamily: 'var(--font-mono)' }}>
                  {filtered.length} of {employees.length} employees
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {filtered.map(emp => (
                    <div
                      key={emp._id}
                      className="card"
                      style={{
                        cursor: 'pointer',
                        padding: 20,
                        borderColor: selected?._id === emp._id ? 'var(--amber)' : 'var(--border)',
                        boxShadow: selected?._id === emp._id ? 'var(--shadow-glow-amber)' : 'none',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => setSelected(selected?._id === emp._id ? null : emp)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10,
                          background: 'linear-gradient(135deg, var(--amber), var(--teal))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
                          color: 'var(--navy-950)', flexShrink: 0,
                        }}>
                          {getInitials(emp.name)}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, color: 'white', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--teal)', marginTop: 2 }}>
                            {emp.empId}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        <span className="emp-tag dept">{emp.department}</span>
                        <span className="emp-tag desig" style={{ fontSize: 10 }}>{emp.designation}</span>
                      </div>

                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        borderTop: '1px solid var(--border)', paddingTop: 10, fontSize: 13
                      }}>
                        <div>
                          <div style={{ color: 'var(--slate-400)', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Basic Pay</div>
                          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)', fontWeight: 600 }}>₹{fmt(emp.basicPay)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: 'var(--slate-400)', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gross</div>
                          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal-light)', fontWeight: 600 }}>₹{fmt(gross(emp))}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Employee Detail */}
              {selected && (
                <div className="card" style={{ position: 'sticky', top: 80, height: 'fit-content' }}>
                  <div className="card-header">
                    <div className="card-title">Employee Details</div>
                    <button className="modal-close" onClick={() => setSelected(null)}>×</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 14,
                      background: 'linear-gradient(135deg, var(--amber), var(--teal))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
                      color: 'var(--navy-950)',
                    }}>
                      {getInitials(selected.name)}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'white' }}>{selected.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal)', marginTop: 2 }}>{selected.empId}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                    {[
                      ['Email', selected.email],
                      ['Phone', selected.phone],
                      ['Department', selected.department],
                      ['Designation', selected.designation],
                      ['Joined', selected.joiningDate ? new Date(selected.joiningDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'],
                      ['Working Days', `${selected.totalWorkingDays} days/month`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--slate-400)' }}>{k}</span>
                        <span style={{ color: 'var(--slate-200)', fontWeight: 500, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Salary Structure</div>
                    {[
                      ['Basic Pay', selected.basicPay, 'var(--amber)'],
                      ['HRA', selected.hra, null],
                      ['DA', selected.da, null],
                      ['TA', selected.ta, null],
                      ['Medical', selected.medicalAllowance, null],
                      ['Special', selected.specialAllowance, null],
                    ].map(([k, v, color]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ color: 'var(--slate-400)' }}>{k}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: color || 'var(--slate-200)' }}>₹{fmt(v)}</span>
                      </div>
                    ))}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)',
                      borderRadius: 'var(--radius)', padding: '10px 12px', marginTop: 8
                    }}>
                      <span style={{ fontWeight: 600, color: 'var(--teal-light)', fontSize: 13 }}>Total Gross</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal)', fontWeight: 700 }}>₹{fmt(gross(selected))}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Deductions</div>
                    {[
                      [`PF (${selected.pf}% of basic)`, `${selected.pf}%`],
                      [`ESI (${selected.esi}%)`, selected.esi > 0 ? `${selected.esi}%` : 'N/A'],
                      ['Professional Tax', `₹${fmt(selected.professionalTax)}`],
                      ['Income Tax (TDS)', `₹${fmt(selected.incomeTax)}/month`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ color: 'var(--slate-400)' }}>{k}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}