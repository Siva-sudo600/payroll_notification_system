const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  empId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  bankAccount: { type: String, required: true },
  ifscCode: { type: String, required: true },

  // Salary components
  basicPay: { type: Number, required: true },
  hra: { type: Number, default: 0 },         // House Rent Allowance
  da: { type: Number, default: 0 },           // Dearness Allowance
  ta: { type: Number, default: 0 },           // Travel Allowance
  medicalAllowance: { type: Number, default: 0 },
  specialAllowance: { type: Number, default: 0 },

  // Deductions
  pf: { type: Number, default: 0 },           // Provident Fund (%)
  esi: { type: Number, default: 0 },          // ESI (%)
  professionalTax: { type: Number, default: 0 }, // Fixed amount
  incomeTax: { type: Number, default: 0 },    // TDS per month

  // Working details
  totalWorkingDays: { type: Number, default: 26 },
  joiningDate: { type: Date },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);