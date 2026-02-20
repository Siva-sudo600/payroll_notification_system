const https = require('https');

/**
 * Send SMS using Fast2SMS
 * Docs: https://docs.fast2sms.com
 */
const sendSMS = async (to, message) => {
  try {
    // Strip country code — Fast2SMS needs 10-digit Indian number
    const phone = to.replace(/^\+91/, '').replace(/\s/g, '').trim();

    const payload = JSON.stringify({
      route: 'q',          // Quick/Transactional route
      message: message,
      language: 'english',
      flash: 0,
      numbers: phone,
    });

    const options = {
      hostname: 'www.fast2sms.com',
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        'authorization': process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    if (result.return === true) {
      console.log(`✅ SMS sent to ${phone}:`, result.message);
      return { success: true, result };
    } else {
      console.error(`❌ SMS failed to ${phone}:`, result.message);
      return { success: false, error: result.message };
    }

  } catch (error) {
    console.error(`❌ SMS error:`, error.message);
    return { success: false, error: error.message };
  }
};

// SMS Templates
const SMS_TEMPLATES = {
  PAYROLL_INITIATED: (month) =>
    `PayrollNotice: The payroll process for ${month} has been initiated. Your salary is being prepared. - HR Team`,

  SALARY_CALCULATED: (name, month, netSalary) =>
    `Hi ${name}, your salary for ${month} has been calculated. Net Payable: Rs.${Number(netSalary).toLocaleString('en-IN')}. Payment is being processed. - HR Team`,

  SALARY_PROCESSING: (name, month) =>
    `Hi ${name}, your salary payment for ${month} is being processed. Funds will be credited shortly. - HR Team`,

  SALARY_PAID: (name, month, netSalary) =>
    `Hi ${name}, your salary of Rs.${Number(netSalary).toLocaleString('en-IN')} for ${month} has been successfully credited. - HR Team`,

  PAYSLIP_GENERATED: (name, month) =>
    `Hi ${name}, your payslip for ${month} has been generated and will be sent to your registered email shortly. - HR Team`,

  PAYROLL_FAILED: (name, month) =>
    `Hi ${name}, there was an issue processing your salary for ${month}. Please contact HR immediately. - HR Team`,
};

module.exports = { sendSMS, SMS_TEMPLATES };