import React, { useState,useEffect } from 'react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { employeeAPI, payrollAPI } from '../services/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const STEPS = ['Employee Lookup', 'Initiate Payroll', 'Calculate Salary', 'Review & Payslip'];

export default function ProcessPayroll() {
  const [step, setStep] = useState(0);
  const [empId, setEmpId] = useState('');
  const [employee, setEmployee] = useState(null);
  const [notified, setNotified] = useState(false);
  const [payroll, setPayroll] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [initiateLoading, setInitiateLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [payslipLoading, setPayslipLoading] = useState(false);

  // ✅ emailLog only — no smsLog
  const [emailLog, setEmailLog] = useState([]);
  const addEmailLog = (msg) => setEmailLog(prev => [...prev, { msg, time: new Date().toLocaleTimeString() }]);

  const [attendance, setAttendance] = useState({
    presentDays: '',
    overtimeHours: 0,
    otherDeductions: 0,
    remarks: '',
  });
  useEffect(() => {
  const savedEmpId = localStorage.getItem('payroll_emp_id');
  if (savedEmpId) {
    setEmpId(savedEmpId);
    autoLookup(savedEmpId);
    localStorage.removeItem('payroll_emp_id'); // clear after use
  }
}, []);

const autoLookup = async (id) => {
  setLookupLoading(true);
  try {
    const { data } = await employeeAPI.lookup(id);
    setEmployee(data);
    setStep(1); // ← skip to Step 1 directly
    toast.success(`Loaded: ${data.name}`);
  } catch (err) {
    toast.error('Employee not found');
  } finally {
    setLookupLoading(false);
  }
};

  const today = new Date();
  const monthLabel = today.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // ✅ Send email notification at each payroll stage
 const sendPayrollEmail = async (stage, netSalary = null) => {
  const senderEmail = localStorage.getItem('payroll_sender_email');
  const senderPassword = localStorage.getItem('payroll_sender_password');
  const recipientEmail = localStorage.getItem('payroll_recipient_email');

  console.log('Sending email:', { senderEmail, recipientEmail, stage });

  if (!senderEmail || !senderPassword || !recipientEmail) {
    addEmailLog(`⚠️ No credentials found. Fill details in Dashboard first.`);
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/mail/send-payroll-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderEmail,
        senderPassword,
        recipientEmail,
        employeeName: employee.name,
        stage,
        month: monthLabel,
        netSalary,
      }),
    });
    const data = await res.json();
    if (data.success) {
      addEmailLog(`📧 Email sent to ${recipientEmail} — Stage: ${stage}`);
    } else {
      addEmailLog(`❌ Email failed: ${data.error}`);
    }
  } catch (err) {
    addEmailLog(`❌ Email error: ${err.message}`);
  }
};

  // ── Step 0: Lookup Employee ──
  const handleLookup = async () => {
    if (!empId.trim()) return toast.error('Please enter an Employee ID');
    setLookupLoading(true);
    try {
      const { data } = await employeeAPI.lookup(empId.trim().toUpperCase());
      setEmployee(data);
      setStep(1);
      toast.success(`Found: ${data.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Employee not found');
    } finally {
      setLookupLoading(false);
    }
  };

  // ── Step 1: Initiate Payroll ──
const handleInitiate = async () => {
  setInitiateLoading(true);
  try {
    const { data } = await payrollAPI.initiate({ empId: employee.empId });
    setPayroll(data.payroll);
    setStep(2);
    await sendPayrollEmail('initiated');
    toast.success('Payroll initiated! Employee notified via Email.');
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to initiate payroll';
    if (err.response?.status === 409) {
      setPayroll(err.response.data.payroll);
      toast(msg, { icon: 'ℹ️' });
      setStep(2);
      await sendPayrollEmail('initiated'); // ✅ added here too
    } else {
      toast.error(msg);
    }
  } finally {
    setInitiateLoading(false);
  }
};
  // ── Step 2: Calculate Salary ──
  const handleCalculate = async () => {
    if (!attendance.presentDays || +attendance.presentDays < 0) {
      return toast.error('Please enter valid present days');
    }
    if (+attendance.presentDays > employee.totalWorkingDays) {
      return toast.error(`Present days cannot exceed ${employee.totalWorkingDays}`);
    }
    setCalcLoading(true);
    try {
      const { data } = await payrollAPI.calculate({
        empId: employee.empId,
        presentDays: +attendance.presentDays,
        overtimeHours: +attendance.overtimeHours || 0,
        otherDeductions: +attendance.otherDeductions || 0,
        remarks: attendance.remarks,
      });
      setPayroll(data.payroll);
      setStep(3);
      await sendPayrollEmail('calculated', data.payroll.netSalary);
      toast.success('Salary calculated! Employee notified via Email.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Calculation failed');
    } finally {
      setCalcLoading(false);
    }
  };

  // ── Step 3: Generate Payslip ──
 const handleGeneratePayslip = async () => {
  setPayslipLoading(true);
  try {
    await payrollAPI.generatePayslip(payroll._id);
    await sendPayrollEmail('payslip');
    toast.success('Payslip generated! Employee notified via Email.');
    setPayroll(prev => ({ ...prev, payslipGenerated: true }));
  } catch (err) {
    console.error('Payslip error:', err);
    toast.error(err.response?.data?.message || 'Failed to generate payslip');
  } finally {
    setPayslipLoading(false);
  }
};
const handleNotifyEmployee = async () => {
  setPayslipLoading(true);
  try {
    if (!payroll.payslipGenerated) {
      await payrollAPI.generatePayslip(payroll._id);
      setPayroll(prev => ({ ...prev, payslipGenerated: true }));
    }
    await sendPayrollEmail('payslip');
    toast.success('Employee notified via email!');
    setNotified(true);
    setStep(4); // ✅ moves step to 4 so step 3 gets tick
  } catch (err) {
    console.error('Notify error:', err);
    toast.error(err.response?.data?.message || 'Failed to notify');
  } finally {
    setPayslipLoading(false);
  }
};

  // ✅ Reset uses emailLog only
  const handleReset = () => {
    setStep(0);
    setEmpId('');
    setEmployee(null);
    setPayroll(null);
    setEmailLog([]);
    setNotified(false);
    setAttendance({ presentDays: '', overtimeHours: 0, otherDeductions: 0, remarks: '' });
  };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">Process Payroll</div>
          </div>
          <div className="topbar-right">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber)', background: 'rgba(245,158,11,0.1)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(245,158,11,0.25)' }}>
              {monthLabel}
            </span>
            {step > 0 && (
              <button className="btn btn-outline btn-sm" onClick={handleReset}>
                ↺ Start Over
              </button>
            )}
          </div>
        </div>

        <div className="page-content">
          {/* Progress Steps */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 40, padding: '0 16px' }}>
            {STEPS.map((label, i) => (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: `2px solid ${i < step ? 'var(--success)' : i === step ? 'var(--amber)' : 'var(--border)'}`,
                    background: i < step ? 'rgba(34,197,94,0.15)' : i === step ? 'rgba(245,158,11,0.15)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                    color: i < step ? 'var(--success)' : i === step ? 'var(--amber)' : 'var(--slate-400)',
                    boxShadow: i === step ? '0 0 16px rgba(245,158,11,0.3)' : 'none',
                    transition: 'all 0.3s ease', zIndex: 1,
                  }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <div style={{
                    position: 'absolute', top: 42, left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', fontSize: 11, fontFamily: 'var(--font-mono)',
                    color: i === step ? 'var(--amber)' : 'var(--slate-400)',
                    letterSpacing: '0.04em', fontWeight: i === step ? 600 : 400,
                  }}>{label}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, margin: '0 -1px',
                    background: i < step ? 'var(--teal)' : 'var(--border)',
                    transition: 'background 0.5s ease',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            <div>
              {/* ── STEP 0: Employee Lookup ── */}
              {step === 0 && (
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">🔍 Employee Lookup</div>
                      <div className="card-subtitle">Enter the Employee ID to begin payroll processing</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label className="form-label">Employee ID</label>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                      <input
                        className="form-control form-control-mono"
                        placeholder="e.g. EMP001"
                        value={empId}
                        onChange={e => setEmpId(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleLookup()}
                        style={{ flex: 1, fontSize: 16 }}
                        autoFocus
                      />
                      <button className="btn btn-primary" onClick={handleLookup} disabled={lookupLoading} style={{ minWidth: 120 }}>
                        {lookupLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Searching</> : '🔍 Search'}
                      </button>
                    </div>
                    <div className="form-hint" style={{ marginTop: 8 }}>Available IDs: EMP001 to EMP008</div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--slate-400)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Select</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['EMP001','EMP002','EMP003','EMP004','EMP005','EMP006','EMP007','EMP008'].map(id => (
                        <button key={id} className="btn btn-outline btn-sm" onClick={() => setEmpId(id)} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 1: Initiate Payroll ── */}
              {step === 1 && employee && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">⚡ Initiate Payroll</div>
                  </div>
                  <div className="emp-card">
                    <div className="emp-avatar-large">{getInitials(employee.name)}</div>
                    <div className="emp-details">
                      <div className="emp-name">{employee.name}</div>
                      <div className="emp-meta">
                        <span className="emp-tag id"># {employee.empId}</span>
                        <span className="emp-tag dept">{employee.department}</span>
                        <span className="emp-tag desig">{employee.designation}</span>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 20, fontSize: 13 }}>
                        <div><span style={{ color: 'var(--slate-400)' }}>📧 </span><span style={{ color: 'var(--slate-300)' }}>{employee.email}</span></div>
                        <div><span style={{ color: 'var(--slate-400)' }}>📱 </span><span style={{ color: 'var(--slate-300)', fontFamily: 'var(--font-mono)' }}>{employee.phone}</span></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--slate-400)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Salary Structure</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'Basic Pay', value: employee.basicPay },
                        { label: 'HRA', value: employee.hra },
                        { label: 'DA', value: employee.da },
                        { label: 'TA', value: employee.ta },
                        { label: 'Medical', value: employee.medicalAllowance },
                        { label: 'Special Allowance', value: employee.specialAllowance },
                      ].map((item) => (
                        <div key={item.label} style={{ background: 'var(--navy-800)', borderRadius: 'var(--radius)', padding: '10px 14px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: 'var(--slate-400)' }}>{item.label}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'white' }}>₹{fmt(item.value)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius)', padding: '12px 14px', marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'var(--amber-light)', fontWeight: 600 }}>Gross (at full attendance)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--amber)', fontWeight: 700 }}>
                        ₹{fmt(employee.basicPay + employee.hra + employee.da + employee.ta + employee.medicalAllowance + employee.specialAllowance)}
                      </span>
                    </div>
                  </div>
                  <div className="alert alert-info">
                    <span>📧</span>
                    <span>Clicking "Initiate Payroll" will send an email to <strong style={{color: 'var(--amber)'}}>{localStorage.getItem('payroll_recipient_email')}</strong> notifying them the payroll process has started.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-outline" onClick={() => setStep(0)}>← Back</button>
                    <button className="btn btn-primary" onClick={handleInitiate} disabled={initiateLoading} style={{ flex: 1 }}>
                      {initiateLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Initiating...</> : '⚡ Initiate Payroll & Notify Employee'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Calculate Salary ── */}
              {step === 2 && employee && (
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">🧮 Calculate Salary</div>
                      <div className="card-subtitle">{employee.name} · {employee.empId} · {monthLabel}</div>
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Days Present *</label>
                      <input className="form-control form-control-mono" type="number" min="0" max={employee.totalWorkingDays} placeholder={`0 - ${employee.totalWorkingDays}`} value={attendance.presentDays} onChange={e => setAttendance({ ...attendance, presentDays: e.target.value })} />
                      <div className="form-hint">Total working days: {employee.totalWorkingDays}</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Absent / LOP Days</label>
                      <input className="form-control form-control-mono" type="number" value={attendance.presentDays ? Math.max(0, employee.totalWorkingDays - +attendance.presentDays) : ''} readOnly placeholder="Auto calculated" />
                      <div className="form-hint">Loss of Pay days</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Overtime Hours</label>
                      <input className="form-control form-control-mono" type="number" min="0" step="0.5" placeholder="0" value={attendance.overtimeHours} onChange={e => setAttendance({ ...attendance, overtimeHours: e.target.value })} />
                      <div className="form-hint">Paid at 2× hourly rate</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Other Deductions (₹)</label>
                      <input className="form-control form-control-mono" type="number" min="0" placeholder="0" value={attendance.otherDeductions} onChange={e => setAttendance({ ...attendance, otherDeductions: e.target.value })} />
                      <div className="form-hint">Additional one-time deduction</div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <input className="form-control" placeholder="Optional notes (e.g., medical leave approved)" value={attendance.remarks} onChange={e => setAttendance({ ...attendance, remarks: e.target.value })} />
                  </div>
                  {attendance.presentDays && <LiveSalaryPreview employee={employee} attendance={attendance} />}
                  <div className="alert alert-info" style={{ marginTop: 16 }}>
                    <span>📧</span>
                    <span>Employee will receive an email with calculated net salary upon clicking calculate.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                    <button className="btn btn-primary" onClick={handleCalculate} disabled={calcLoading || !attendance.presentDays} style={{ flex: 1 }}>
                      {calcLoading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Calculating...</> : '🧮 Calculate & Notify Employee'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Review & Payslip ── */}
              {step === 3 && payroll && employee && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">✅ Salary Calculated</div>
                    <span className={`status-badge ${payroll.status}`}>{payroll.status}</span>
                  </div>
                  <PayslipPreview employee={employee} payroll={payroll} />
                 <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
  <button
  className="btn btn-primary"
  onClick={handleNotifyEmployee}
  disabled={notified}
  style={{ flex: 1, background: notified ? 'var(--success)' : '' }}
>
  {notified ? '✅ Notified' : '📧 Notify Employee'}
</button>
  <button className="btn btn-outline" onClick={handleReset}>Process Another Employee</button>
</div>
{payroll.payslipGenerated && (
  <div className="alert alert-info" style={{ marginTop: 12 }}>
    <span>✅</span>
    <span>Payslip generated! Click <strong>Notify Employee</strong> to send email to recipient.</span>
  </div>
)}
                </div>
              )}
            </div>

            {/* ✅ Right Panel: Email Notifications Log */}
            <div>
              <div className="card" style={{ position: 'sticky', top: 80 }}>
                <div className="card-header">
                  <div className="card-title">📧 Email Notifications</div>
                </div>
                {emailLog.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--slate-400)' }}>
                    <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📭</div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>No notifications sent yet</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {emailLog.map((log, i) => (
                      <div key={i} style={{ background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
                        <div style={{ fontSize: 12, color: 'var(--teal-light)', lineHeight: 1.5 }}>{log.msg}</div>
                        <div style={{ fontSize: 10, color: 'var(--slate-400)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>{log.time}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Process Guide</div>
                  {STEPS.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, opacity: i > step ? 0.4 : 1 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: i < step ? 'rgba(34,197,94,0.2)' : i === step ? 'rgba(245,158,11,0.2)' : 'var(--navy-700)',
                        border: `1px solid ${i < step ? 'var(--success)' : i === step ? 'var(--amber)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: i < step ? 'var(--success)' : i === step ? 'var(--amber)' : 'var(--slate-400)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {i < step ? '✓' : i + 1}
                      </div>
                      <div style={{ fontSize: 12, color: i === step ? 'var(--amber-light)' : 'var(--slate-400)' }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Live Salary Preview Component ──
function LiveSalaryPreview({ employee, attendance }) {
  const totalWD = employee.totalWorkingDays;
  const pd = +attendance.presentDays || 0;
  const absent = Math.max(0, totalWD - pd);
  const basicPay = +(employee.basicPay / totalWD * pd).toFixed(2);
  const hra = +(employee.hra / totalWD * pd).toFixed(2);
  const da = +(employee.da / totalWD * pd).toFixed(2);
  const ta = +(employee.ta / totalWD * pd).toFixed(2);
  const medical = +(employee.medicalAllowance / totalWD * pd).toFixed(2);
  const special = +(employee.specialAllowance / totalWD * pd).toFixed(2);
  const hourlyRate = employee.basicPay / (totalWD * 8);
  const overtime = +(hourlyRate * (+attendance.overtimeHours || 0) * 2).toFixed(2);
  const gross = +(basicPay + hra + da + ta + medical + special + overtime).toFixed(2);
  const pf = +(employee.pf / 100 * basicPay).toFixed(2);
  const esi = +(employee.esi / 100 * gross).toFixed(2);
  const profTax = employee.professionalTax;
  const incomeTax = employee.incomeTax;
  const other = +attendance.otherDeductions || 0;
  const totalDed = +(pf + esi + profTax + incomeTax + other).toFixed(2);
  const net = +(gross - totalDed).toFixed(2);
  const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n);

  return (
    <div>
      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--slate-400)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Salary Preview</div>
      <div className="salary-breakdown">
        <div className="breakdown-row header"><span>Earnings Component</span><span>Amount (₹)</span></div>
        {[['Basic Pay', basicPay],['HRA', hra],['DA', da],['TA', ta],['Medical Allowance', medical],['Special Allowance', special],...(overtime > 0 ? [['Overtime Pay', overtime]] : [])].map(([label, val]) => (
          <div className="breakdown-row" key={label}><span className="breakdown-label">{label}</span><span className="breakdown-value">{fmt(val)}</span></div>
        ))}
        <div className="breakdown-row total"><span>Gross Earnings</span><span>{fmt(gross)}</span></div>
        <div className="breakdown-row header"><span>Deductions</span><span>Amount (₹)</span></div>
        {[[`PF (${employee.pf}% of Basic)`, pf],...(esi > 0 ? [[`ESI (${employee.esi}%)`, esi]] : []),['Professional Tax', profTax],['Income Tax (TDS)', incomeTax],...(other > 0 ? [['Other Deductions', other]] : [])].map(([label, val]) => (
          <div className="breakdown-row" key={label}><span className="breakdown-label">{label}</span><span className="breakdown-deduct">- {fmt(val)}</span></div>
        ))}
        <div className="breakdown-row net"><span>NET SALARY PAYABLE</span><span>₹ {fmt(net)}</span></div>
      </div>
      {absent > 0 && (
        <div className="alert alert-warning" style={{ marginTop: 10 }}>
          <span>⚠️</span><span>{absent} day(s) absent — Loss of Pay applied proportionally</span>
        </div>
      )}
    </div>
  );
}

// ── Payslip Preview Component ──
function PayslipPreview({ employee, payroll }) {
  const fmt2 = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n || 0);
  return (
    <div className="payslip-preview">
      <div className="payslip-header">
        <div>
          <div className="payslip-company">Tech<span>Corp</span> Pvt. Ltd.</div>
          <div style={{ fontSize: 12, color: 'var(--slate-400)', marginTop: 4 }}>Payslip for {payroll.month}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--slate-300)' }}>Generated</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate-400)' }}>{new Date().toLocaleDateString('en-IN')}</div>
        </div>
      </div>
      <div className="payslip-body">
        <div className="payslip-emp-details">
          <span className="pkey">Employee Name</span><span className="pval">{employee.name}</span>
          <span className="pkey">Employee ID</span><span className="pval">{employee.empId}</span>
          <span className="pkey">Department</span><span className="pval">{employee.department}</span>
          <span className="pkey">Designation</span><span className="pval">{employee.designation}</span>
          <span className="pkey">Days Present</span><span className="pval">{payroll.presentDays} / {payroll.totalWorkingDays}</span>
          <span className="pkey">Bank Account</span><span className="pval">****{employee.bankAccount?.slice(-4)}</span>
        </div>
        <div className="payslip-tables">
          <div className="payslip-table-section">
            <h4>Earnings</h4>
            <table className="payslip-table">
              <tbody>
                <tr><td>Basic Pay</td><td>{fmt2(payroll.basicPay)}</td></tr>
                <tr><td>HRA</td><td>{fmt2(payroll.hra)}</td></tr>
                <tr><td>DA</td><td>{fmt2(payroll.da)}</td></tr>
                <tr><td>TA</td><td>{fmt2(payroll.ta)}</td></tr>
                <tr><td>Medical</td><td>{fmt2(payroll.medicalAllowance)}</td></tr>
                <tr><td>Special</td><td>{fmt2(payroll.specialAllowance)}</td></tr>
                {payroll.overtimePay > 0 && <tr><td>Overtime</td><td>{fmt2(payroll.overtimePay)}</td></tr>}
                <tr style={{ fontWeight: 700, borderTop: '1px solid #e2e8f0' }}><td>Gross</td><td>{fmt2(payroll.grossEarnings)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="payslip-table-section">
            <h4>Deductions</h4>
            <table className="payslip-table">
              <tbody>
                <tr><td>PF</td><td>{fmt2(payroll.pfAmount)}</td></tr>
                {payroll.esiAmount > 0 && <tr><td>ESI</td><td>{fmt2(payroll.esiAmount)}</td></tr>}
                <tr><td>Prof. Tax</td><td>{fmt2(payroll.professionalTax)}</td></tr>
                <tr><td>Income Tax</td><td>{fmt2(payroll.incomeTax)}</td></tr>
                {payroll.otherDeductions > 0 && <tr><td>Others</td><td>{fmt2(payroll.otherDeductions)}</td></tr>}
                <tr style={{ fontWeight: 700, borderTop: '1px solid #e2e8f0' }}><td>Total Deductions</td><td>{fmt2(payroll.totalDeductions)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="payslip-net">
          <div className="payslip-net-label">Net Salary Payable</div>
          <div className="payslip-net-value">₹{fmt2(payroll.netSalary)}</div>
        </div>
      </div>
    </div>
  );
}