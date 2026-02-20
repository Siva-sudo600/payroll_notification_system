const express = require('express');
const router = express.Router();
const https = require('https');

router.post('/send-test-sms', async (req, res) => {
  const { phone, message } = req.body;

  try {
    const payload = JSON.stringify({
      route: 'q',
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
      const req = https.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(payload);
      req.end();
    });

    res.json({ success: result.return === true, data: result, error: result.message });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

module.exports = router;