const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Create transporter using Gmail
const createTransporter = (email, password) => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: password,
    },
  });
};

// Send test email
router.post('/send-test-email', async (req, res) => {
  const { senderEmail, senderPassword, recipientEmail, subject, message } = req.body;

  try {
    const transporter = createTransporter(senderEmail, senderPassword);

    await transporter.sendMail({
      from: `"PayrollPro System" <${senderEmail}>`,
      to: recipientEmail,
      subject: subject || 'PayrollPro Test Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0d1f42; padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">Anna<span style="color: #f59e0b;">Pay</span></h2>
<p style="color: #94a3b8; margin: 4px 0 0;">AnnaPay Notification System</p>
          </div>
          <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;">
            <p style="color: #334155; font-size: 15px;">${message}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">This is an automated notification from Anna Pay Pro system.</p>
          </div>
        </div>
      `,
    });

    res.json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Send payroll stage notification email
router.post('/send-payroll-email', async (req, res) => {
  const { senderEmail, senderPassword, recipientEmail, employeeName, stage, month, netSalary } = req.body;

  const stageMessages = {
    initiated: {
      subject: `Payroll Initiated - ${month}`,
      body: `Dear ${employeeName},<br/><br/>The payroll process for <strong>${month}</strong> has been initiated. Your salary is currently being prepared by the HR team.<br/><br/>You will be notified at each stage of the process.`
    },
    calculated: {
      subject: `Salary Calculated - ${month}`,
      body: `Dear ${employeeName},<br/><br/>Your salary for <strong>${month}</strong> has been calculated successfully.<br/><br/><strong style="font-size: 18px; color: #0d1f42;">Net Salary Payable: ₹${Number(netSalary).toLocaleString('en-IN')}</strong><br/><br/>Your payment is currently being processed.`
    },
    payslip: {
      subject: `Payslip Generated - ${month}`,
      body: `Dear ${employeeName},<br/><br/>Your payslip for <strong>${month}</strong> has been generated successfully.<br/><br/>Please contact HR if you have any queries regarding your salary.`
    }
  };

  const { subject, body } = stageMessages[stage] || {
    subject: 'Payroll Notification',
    body: `Dear ${employeeName}, your payroll for ${month} has been updated.`
  };

  try {
    const transporter = createTransporter(senderEmail, senderPassword);

    await transporter.sendMail({
      from: `"AnnaPayPro System" <${senderEmail}>`,
      to: recipientEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0d1f42; padding: 24px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">Anna Pay<span style="color: #f59e0b;"> Pro</span></h2>
            <p style="color: #94a3b8; margin: 4px 0 0;">Anna Pay Pro Notification System</p>
          </div>
          <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px;">
            <p style="color: #334155; font-size: 15px;">${body}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
           <p style="color: #94a3b8; font-size: 12px;">This is an automated notification from Anna Pay Pro. Please do not reply to this email.</p>
          </div>
        </div>
      `,
    });

    res.json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;