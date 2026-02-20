const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const authMiddleware = require('../middleware/auth');

// Get employee by empId
router.get('/lookup/:empId', authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findOne({ empId: req.params.empId, status: 'active' });
    if (!employee) {
      return res.status(404).json({ message: `No active employee found with ID: ${req.params.empId}` });
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all employees (for dashboard stats)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const employees = await Employee.find({ status: 'active' }).select('-bankAccount');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get employee stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const total = await Employee.countDocuments({ status: 'active' });
    const byDept = await Employee.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    res.json({ total, byDepartment: byDept });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;