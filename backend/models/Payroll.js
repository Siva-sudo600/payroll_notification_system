const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  empId: { type: String, required: true },
  employeeRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  month: { type: String, required: true }, // e.g., "March 2026"
  monthYear: { type: String, required: true }, // e.g., "2026-03"

  // Attendance
  presentDays: { type: Number, required: true },
  totalWorkingDays: { type: Number, required: true },
  leaveDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },

  // Earnings
  basicPay: { type: Number },
  hra: { type: Number },
  da: { type: Number },
  ta: { type: Number },
  medicalAllowance: { type: Number },
  specialAllowance: { type: Number },
  overtimePay: { type: Number, default: 0 },
  grossEarnings: { type: Number },

  // Deductions
  pfAmount: { type: Number },
  esiAmount: { type: Number },
  professionalTax: { type: Number },
  incomeTax: { type: Number },
  lossOfPay: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  totalDeductions: { type: Number },

  // Net
  netSalary: { type: Number },

  // Status tracking
  status: {
    type: String,
    enum: ['initiated', 'calculated', 'processed', 'paid', 'failed'],
    default: 'initiated'
  },

  payslipGenerated: { type: Boolean, default: false },
  payslipGeneratedAt: { type: Date },

  processedBy: { type: String }, // admin email
  processedAt: { type: Date },
  paidAt: { type: Date },

  remarks: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payroll', payrollSchema);