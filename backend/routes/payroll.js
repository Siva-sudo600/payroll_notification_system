const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const authMiddleware = require('../middleware/auth');
const { sendSMS, SMS_TEMPLATES } = require('../utils/smsService');

// Helper: get month name
const getMonthName = (date = new Date()) => {
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

const getMonthYear = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

// ─── INITIATE PAYROLL ────────────────────────────────────────────────────────
router.post('/initiate', authMiddleware, async (req, res) => {
  try {
    const { empId, month, year } = req.body;
    if (!empId) return res.status(400).json({ message: 'Employee ID is required' });

    const employee = await Employee.findOne({ empId, status: 'active' });
    if (!employee) return res.status(404).json({ message: `Employee ${empId} not found` });

    // Determine month
    const targetDate = month && year ? new Date(year, month - 1) : new Date();
    const monthLabel = getMonthName(targetDate);
    const monthYearKey = getMonthYear(targetDate);

    // Check if payroll already exists
    const existing = await Payroll.findOne({ empId, monthYear: monthYearKey });
    if (existing) {
      return res.status(409).json({
        message: `Payroll for ${employee.name} already ${existing.status} for ${monthLabel}`,
        payroll: existing
      });
    }

    // Create payroll record
    const payroll = new Payroll({
      empId,
      employeeRef: employee._id,
      month: monthLabel,
      monthYear: monthYearKey,
      presentDays: 0,
      totalWorkingDays: employee.totalWorkingDays,
      status: 'initiated',
      processedBy: req.admin.email,
    });
    await payroll.save();

    // Send SMS
    await sendSMS(employee.phone, SMS_TEMPLATES.PAYROLL_INITIATED(monthLabel));

    res.status(201).json({
      message: `Payroll initiated for ${employee.name} - ${monthLabel}`,
      payroll,
      employee: { name: employee.name, empId: employee.empId, department: employee.department }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── CALCULATE SALARY ────────────────────────────────────────────────────────
router.post('/calculate', authMiddleware, async (req, res) => {
  try {
    const { empId, presentDays, overtimeHours = 0, otherDeductions = 0, remarks = '' } = req.body;

    if (!empId || presentDays === undefined) {
      return res.status(400).json({ message: 'empId and presentDays are required' });
    }

    const employee = await Employee.findOne({ empId, status: 'active' });
    if (!employee) return res.status(404).json({ message: `Employee ${empId} not found` });

    // Find current month's payroll or create one
    const monthYearKey = getMonthYear();
    const monthLabel = getMonthName();

    let payroll = await Payroll.findOne({ empId, monthYear: monthYearKey });
    if (!payroll) {
      payroll = new Payroll({
        empId,
        employeeRef: employee._id,
        month: monthLabel,
        monthYear: monthYearKey,
        presentDays,
        totalWorkingDays: employee.totalWorkingDays,
        status: 'initiated',
        processedBy: req.admin.email,
      });
    }

    const { totalWorkingDays } = employee;
    const perDaySalary = (employee.basicPay + employee.hra + employee.da + employee.ta +
      employee.medicalAllowance + employee.specialAllowance) / totalWorkingDays;

    const absentDays = Math.max(0, totalWorkingDays - presentDays);
    const lossOfPay = absentDays > 0 ? +(perDaySalary * absentDays).toFixed(2) : 0;

    // Earnings
    const actualBasic = +((employee.basicPay / totalWorkingDays) * presentDays).toFixed(2);
    const actualHra = +((employee.hra / totalWorkingDays) * presentDays).toFixed(2);
    const actualDa = +((employee.da / totalWorkingDays) * presentDays).toFixed(2);
    const actualTa = +((employee.ta / totalWorkingDays) * presentDays).toFixed(2);
    const actualMedical = +((employee.medicalAllowance / totalWorkingDays) * presentDays).toFixed(2);
    const actualSpecial = +((employee.specialAllowance / totalWorkingDays) * presentDays).toFixed(2);

    // Overtime (assuming 2x hourly rate)
    const hourlyRate = employee.basicPay / (totalWorkingDays * 8);
    const overtimePay = +(hourlyRate * overtimeHours * 2).toFixed(2);

    const grossEarnings = +(actualBasic + actualHra + actualDa + actualTa +
      actualMedical + actualSpecial + overtimePay).toFixed(2);

    // Deductions
    const pfAmount = +((employee.pf / 100) * actualBasic).toFixed(2);
    const esiAmount = +((employee.esi / 100) * grossEarnings).toFixed(2);
    const totalDeductions = +(pfAmount + esiAmount + employee.professionalTax +
      employee.incomeTax + parseFloat(otherDeductions)).toFixed(2);

    const netSalary = +(grossEarnings - totalDeductions).toFixed(2);

    // Update payroll
    Object.assign(payroll, {
      presentDays: +presentDays,
      absentDays,
      leaveDays: absentDays,
      overtimeHours: +overtimeHours,
      basicPay: actualBasic,
      hra: actualHra,
      da: actualDa,
      ta: actualTa,
      medicalAllowance: actualMedical,
      specialAllowance: actualSpecial,
      overtimePay,
      grossEarnings,
      pfAmount,
      esiAmount,
      professionalTax: employee.professionalTax,
      incomeTax: employee.incomeTax,
      lossOfPay,
      otherDeductions: +otherDeductions,
      totalDeductions,
      netSalary,
      status: 'calculated',
      processedBy: req.admin.email,
      processedAt: new Date(),
      remarks,
    });

    await payroll.save();

    // Send SMS
    await sendSMS(employee.phone, SMS_TEMPLATES.SALARY_CALCULATED(employee.name, monthLabel, netSalary));

    res.json({
      message: 'Salary calculated successfully',
      payroll,
      employee: { name: employee.name, empId: employee.empId, phone: employee.phone }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GENERATE PAYSLIP ────────────────────────────────────────────────────────
router.post('/payslip/:payrollId', authMiddleware, async (req, res) => {
  const payroll = await Payroll.findById(req.params.payrollId).populate('employeeRef');
  if (!payroll) return res.status(404).json({ message: 'Payroll not found' });
  if (payroll.status === 'initiated') 
    return res.status(400).json({ message: 'Salary must be calculated first' });

  // ✅ Allow even if already generated
  payroll.payslipGenerated = true;
  payroll.payslipGeneratedAt = new Date();
  await payroll.save();

  res.json({ message: 'Payslip generated successfully', payroll });
});

// ─── GET PAYROLL HISTORY ─────────────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { empId, monthYear, status, limit = 20 } = req.query;
    const query = {};
    if (empId) query.empId = empId;
    if (monthYear) query.monthYear = monthYear;
    if (status) query.status = status;

    const payrolls = await Payroll.find(query)
      .populate('employeeRef', 'name department designation phone')
      .sort({ createdAt: -1 })
      .limit(+limit);

    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET SINGLE PAYROLL ───────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('employeeRef');
    if (!payroll) return res.status(404).json({ message: 'Payroll not found' });
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const monthYear = getMonthYear();

    const [totalPayrolls, processed, totalPayout, recentActivity] = await Promise.all([
      Payroll.countDocuments({ monthYear }),
      Payroll.countDocuments({ monthYear, status: { $in: ['calculated', 'paid'] } }),
      Payroll.aggregate([
        { $match: { monthYear, status: { $in: ['calculated', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$netSalary' } } }
      ]),
      Payroll.find()
        .populate('employeeRef', 'name department')
        .sort({ updatedAt: -1 })
        .limit(5)
    ]);

    res.json({
      monthYear,
      totalPayrolls,
      processed,
      pending: totalPayrolls - processed,
      totalPayout: totalPayout[0]?.total || 0,
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;