/**
 * SEED SCRIPT - Populates MongoDB with sample employee data
 * Run: npm run seed
 */

require('dotenv').config({ path: __dirname + '/.env' });
console.log('MONGO_URI:', process.env.MONGO_URI);
const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Admin = require('./models/Admin');

const employees = [
  {
    empId: 'EMP001',
    name: 'Arjun Krishnamurthy',
    email: 'arjun.krishnamurthy@techcorp.com',
    phone: '+919876543210',
    department: 'Engineering',
    designation: 'Senior Software Engineer',
    bankAccount: '123456789012',
    ifscCode: 'SBIN0001234',
    basicPay: 65000,
    hra: 26000,        // 40% of basic
    da: 3250,          // 5% of basic
    ta: 2000,
    medicalAllowance: 1500,
    specialAllowance: 5000,
    pf: 12,            // 12% of basic
    esi: 0.75,         // 0.75% of gross (applicable if salary < 21000)
    professionalTax: 200,
    incomeTax: 8000,
    totalWorkingDays: 26,
    joiningDate: new Date('2020-06-15'),
    status: 'active'
  },
  {
    empId: 'EMP002',
    name: 'Priya Subramaniam',
    email: 'priya.subramaniam@techcorp.com',
    phone: '+919876543211',
    department: 'Human Resources',
    designation: 'HR Manager',
    bankAccount: '234567890123',
    ifscCode: 'HDFC0002345',
    basicPay: 55000,
    hra: 22000,
    da: 2750,
    ta: 1800,
    medicalAllowance: 1500,
    specialAllowance: 4000,
    pf: 12,
    esi: 0,
    professionalTax: 200,
    incomeTax: 5500,
    totalWorkingDays: 26,
    joiningDate: new Date('2019-03-01'),
    status: 'active'
  },
  {
    empId: 'EMP003',
    name: 'Ravi Chandrasekaran',
    email: 'ravi.chandrasekaran@techcorp.com',
    phone: '+919876543212',
    department: 'Finance',
    designation: 'Financial Analyst',
    bankAccount: '345678901234',
    ifscCode: 'ICIC0003456',
    basicPay: 50000,
    hra: 20000,
    da: 2500,
    ta: 1500,
    medicalAllowance: 1250,
    specialAllowance: 3500,
    pf: 12,
    esi: 0,
    professionalTax: 200,
    incomeTax: 4200,
    totalWorkingDays: 26,
    joiningDate: new Date('2021-01-10'),
    status: 'active'
  },
  {
    empId: 'EMP004',
    name: 'Meena Rajendran',
    email: 'meena.rajendran@techcorp.com',
    phone: '+919876543213',
    department: 'Marketing',
    designation: 'Marketing Executive',
    bankAccount: '456789012345',
    ifscCode: 'AXIS0004567',
    basicPay: 38000,
    hra: 15200,
    da: 1900,
    ta: 1500,
    medicalAllowance: 1000,
    specialAllowance: 2500,
    pf: 12,
    esi: 0.75,
    professionalTax: 150,
    incomeTax: 1500,
    totalWorkingDays: 26,
    joiningDate: new Date('2022-07-20'),
    status: 'active'
  },
  {
    empId: 'EMP005',
    name: 'Karthik Venkatesh',
    email: 'karthik.venkatesh@techcorp.com',
    phone: '+919876543214',
    department: 'Engineering',
    designation: 'Junior Developer',
    bankAccount: '567890123456',
    ifscCode: 'SBIN0005678',
    basicPay: 32000,
    hra: 12800,
    da: 1600,
    ta: 1200,
    medicalAllowance: 800,
    specialAllowance: 1800,
    pf: 12,
    esi: 0.75,
    professionalTax: 150,
    incomeTax: 0,
    totalWorkingDays: 26,
    joiningDate: new Date('2023-04-01'),
    status: 'active'
  },
  {
    empId: 'EMP006',
    name: 'Divya Natarajan',
    email: 'divya.natarajan@techcorp.com',
    phone: '+919876543215',
    department: 'Operations',
    designation: 'Operations Manager',
    bankAccount: '678901234567',
    ifscCode: 'HDFC0006789',
    basicPay: 60000,
    hra: 24000,
    da: 3000,
    ta: 2000,
    medicalAllowance: 1500,
    specialAllowance: 4500,
    pf: 12,
    esi: 0,
    professionalTax: 200,
    incomeTax: 7000,
    totalWorkingDays: 26,
    joiningDate: new Date('2018-11-15'),
    status: 'active'
  },
  {
    empId: 'EMP007',
    name: 'Suresh Balakrishnan',
    email: 'suresh.balakrishnan@techcorp.com',
    phone: '+919876543216',
    department: 'IT Support',
    designation: 'IT Support Specialist',
    bankAccount: '789012345678',
    ifscCode: 'ICIC0007890',
    basicPay: 28000,
    hra: 11200,
    da: 1400,
    ta: 1000,
    medicalAllowance: 700,
    specialAllowance: 1500,
    pf: 12,
    esi: 0.75,
    professionalTax: 100,
    incomeTax: 0,
    totalWorkingDays: 26,
    joiningDate: new Date('2022-02-14'),
    status: 'active'
  },
  {
    empId: 'EMP008',
    name: 'Anitha Gopalan',
    email: 'anitha.gopalan@techcorp.com',
    phone: '+919876543217',
    department: 'Design',
    designation: 'UI/UX Designer',
    bankAccount: '890123456789',
    ifscCode: 'AXIS0008901',
    basicPay: 45000,
    hra: 18000,
    da: 2250,
    ta: 1500,
    medicalAllowance: 1125,
    specialAllowance: 3000,
    pf: 12,
    esi: 0,
    professionalTax: 200,
    incomeTax: 2800,
    totalWorkingDays: 26,
    joiningDate: new Date('2021-09-01'),
    status: 'active'
  }
];

const defaultAdmin = {
  name: 'Admin User',
  email: 'admin@techcorp.com',
  password: 'Admin@123',
  role: 'admin'
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Employee.deleteMany({});
    await Admin.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert employees
    const insertedEmployees = await Employee.insertMany(employees);
    console.log(`✅ Inserted ${insertedEmployees.length} employees`);

    // Insert admin
    const admin = new Admin(defaultAdmin);
    await admin.save();
    console.log('✅ Admin account created');

    console.log('\n═══════════════════════════════════════════');
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════');
    console.log('\n📋 ADMIN LOGIN CREDENTIALS:');
    console.log(`   Email    : ${defaultAdmin.email}`);
    console.log(`   Password : ${defaultAdmin.password}`);
    console.log('\n👥 EMPLOYEE IDs AVAILABLE:');
    employees.forEach(e => {
      console.log(`   ${e.empId} - ${e.name} (${e.department})`);
    });
    console.log('\n🚀 You can now start the server: npm run dev');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();