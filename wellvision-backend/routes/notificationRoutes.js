// routes/notificationRoutes.js
import express from 'express';
import userAuth from '../middleware/userAuth.js';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';

const router = express.Router();

// Get current user's notification preferences (from settings)
router.get('/prefs', userAuth, async (req, res) => {
  const user = await userModel.findById(req.user.id).select('settings email name');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const prefs = user.settings?.notifications || {};
  res.json({ success: true, prefs });
});

// Test email notification to current user
router.post('/test/email', userAuth, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select('email name settings');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.settings?.notifications?.emailNotifications === false) {
      return res.status(400).json({ success: false, message: 'Email notifications disabled in settings' });
    }

    const mail = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'WellVision - Test Notification',
      text: `Hello ${user.name || ''}, this is a test notification from WellVision.`.trim()
    };

    const info = await transporter.sendMail(mail);
    res.json({ success: true, message: 'Test email sent', id: info.messageId, response: info.response });
  } catch (e) {
    console.error('Email send error:', e);
    res.status(500).json({ success: false, message: 'Email send failed', error: e.message });
  }
});

// Test SMS notification (Twilio)
router.post('/test/sms', userAuth, async (req, res) => {
  try {
    const { phone } = req.body || {};
    const user = await userModel.findById(req.user.id).select('phone name settings');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.settings?.notifications?.smsNotifications === false) {
      return res.status(400).json({ success: false, message: 'SMS notifications disabled in settings' });
    }

    const to = (phone || user.phone || '').trim();
    if (!to) return res.status(400).json({ success: false, message: 'No phone number available' });

    const { sendSms } = await import('../utils/smsClient.js');
    const info = await sendSms({ to, body: `Hello ${user.name || ''}, this is a test SMS from WellVision.`.trim() });

    // Handle different response formats for different providers
    const response = {
      success: true,
      sid: info.sid,
      status: info.status,
      provider: info.provider || 'twilio'
    };

    // Add 'from' field only for Twilio
    if (info.provider !== 'aws-sns') {
      response.from = process.env.TWILIO_FROM_NUMBER;
    }

    res.json(response);
  } catch (e) {
    console.error('SMS send error:', e);
    const code = e.code || e.status || null;
    const more = e.moreInfo || null;
    res.status(500).json({ success: false, message: 'SMS send failed', error: e.message, code, more });
  }
});

// Verify Twilio configuration and FROM number capabilities
router.get('/verify-sms', userAuth, async (req, res) => {
  try {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
      return res.status(400).json({ success: false, message: 'Missing TWILIO_* env vars', vars: {
        TWILIO_ACCOUNT_SID: !!TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: !!TWILIO_AUTH_TOKEN,
        TWILIO_FROM_NUMBER: !!TWILIO_FROM_NUMBER
      }});
    }
    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const acct = await client.api.accounts(TWILIO_ACCOUNT_SID).fetch();

    // Try to find the FROM number among your incoming numbers
    const nums = await client.incomingPhoneNumbers.list({ phoneNumber: TWILIO_FROM_NUMBER, limit: 1 });
    const fromMeta = nums[0] || null;
    const caps = fromMeta?.capabilities || {};

    res.json({
      success: true,
      account: { sid: acct.sid, friendlyName: acct.friendlyName, status: acct.status, type: acct.type },
      fromNumber: TWILIO_FROM_NUMBER,
      fromMeta: fromMeta ? { sid: fromMeta.sid, phoneNumber: fromMeta.phoneNumber, capabilities: caps } : null
    });
  } catch (e) {
    console.error('Verify SMS error:', e);
    res.status(500).json({ success: false, message: 'Verify SMS failed', error: e.message, code: e.code || null });
  }
});

// Verify SMS configuration (supports both Twilio and AWS SNS)
router.get('/verify-sms-config', userAuth, async (req, res) => {
  try {
    const { SMS_PROVIDER = 'twilio' } = process.env;

    if (SMS_PROVIDER.toLowerCase() === 'aws') {
      // Verify AWS SNS configuration
      const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
      if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
        return res.status(400).json({
          success: false,
          message: 'Missing AWS credentials',
          provider: 'aws-sns',
          vars: {
            AWS_ACCESS_KEY_ID: !!AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY: !!AWS_SECRET_ACCESS_KEY,
            AWS_REGION: AWS_REGION || 'us-east-1'
          }
        });
      }

      // Test AWS SNS connection
      const AWS = (await import('aws-sdk')).default;
      AWS.config.update({
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
        region: AWS_REGION || 'us-east-1'
      });
      const sns = new AWS.SNS();

      // Try to get SNS attributes to verify connection
      const attributes = await sns.getSMSAttributes().promise();

      res.json({
        success: true,
        provider: 'aws-sns',
        region: AWS_REGION || 'us-east-1',
        smsAttributes: attributes
      });
    } else {
      // Verify Twilio configuration
      const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
        return res.status(400).json({
          success: false,
          message: 'Missing TWILIO_* env vars',
          provider: 'twilio',
          vars: {
            TWILIO_ACCOUNT_SID: !!TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN: !!TWILIO_AUTH_TOKEN,
            TWILIO_FROM_NUMBER: !!TWILIO_FROM_NUMBER
          }
        });
      }
      const twilio = (await import('twilio')).default;
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const acct = await client.api.accounts(TWILIO_ACCOUNT_SID).fetch();

      // Try to find the FROM number among your incoming numbers
      const nums = await client.incomingPhoneNumbers.list({ phoneNumber: TWILIO_FROM_NUMBER, limit: 1 });
      const fromMeta = nums[0] || null;
      const caps = fromMeta?.capabilities || {};

      res.json({
        success: true,
        provider: 'twilio',
        account: { sid: acct.sid, friendlyName: acct.friendlyName, status: acct.status, type: acct.type },
        fromNumber: TWILIO_FROM_NUMBER,
        fromMeta: fromMeta ? { sid: fromMeta.sid, phoneNumber: fromMeta.phoneNumber, capabilities: caps } : null
      });
    }
  } catch (e) {
    console.error('Verify SMS config error:', e);
    res.status(500).json({
      success: false,
      message: 'SMS configuration verification failed',
      error: e.message,
      code: e.code || null
    });
  }
});

// Verify SMTP connectivity
router.get('/verify-smtp', userAuth, async (req, res) => {
  try {
    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection verified' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'SMTP verification failed', error: e.message });
  }
});

export default router;