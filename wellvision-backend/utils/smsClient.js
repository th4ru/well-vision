// utils/smsClient.js
import twilio from 'twilio';
import AWS from 'aws-sdk';

let twilioClient = null;
let snsClient = null;

export function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!twilioClient) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials missing: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
}

export function getSNSClient() {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
  if (!snsClient) {
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials missing: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    }
    AWS.config.update({
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      region: AWS_REGION || 'us-east-1'
    });
    snsClient = new AWS.SNS();
  }
  return snsClient;
}

export async function sendSms({ to, body }) {
  const { SMS_PROVIDER = 'twilio' } = process.env;

  switch (SMS_PROVIDER.toLowerCase()) {
    case 'aws':
      return await sendSmsAWS({ to, body });
    case 'textbee':
      return await sendSmsTextBee({ to, body });
    case 'txtmsg':
    case 'txtmsg.lk':
      return await sendSmsTxtMsgLk({ to, body });
    default:
      return await sendSmsTwilio({ to, body });
  }
}

export async function sendSmsTwilio({ to, body }) {
  const { TWILIO_FROM_NUMBER, TWILIO_MESSAGING_SERVICE_SID } = process.env;
  const c = getTwilioClient();

  const params = { to, body };

  if (TWILIO_MESSAGING_SERVICE_SID) {
    // Prefer Messaging Service if configured
    params.messagingServiceSid = TWILIO_MESSAGING_SERVICE_SID;
  } else {
    if (!TWILIO_FROM_NUMBER) {
      throw new Error('TWILIO_FROM_NUMBER is not configured');
    }
    params.from = TWILIO_FROM_NUMBER;
  }

  const msg = await c.messages.create(params);
  return msg;
}

export async function sendSmsAWS({ to, body }) {
  const sns = getSNSClient();

  // Ensure phone number is in E.164 format
  let phoneNumber = to;
  if (!phoneNumber.startsWith('+')) {
    phoneNumber = `+${phoneNumber}`;
  }

  const params = {
    Message: body,
    PhoneNumber: phoneNumber,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional'
      }
    }
  };

  const result = await sns.publish(params).promise();
  return {
    sid: result.MessageId,
    status: 'sent',
    provider: 'aws-sns'
  };
}

export async function sendSmsTxtMsgLk({ to, body }) {
  const { TXTMSG_API_KEY, TXTMSG_SENDER_ID } = process.env;

  if (!TXTMSG_API_KEY) {
    throw new Error('txtmsg.lk credentials missing: set TXTMSG_API_KEY');
  }

  // Ensure phone number is in international format
  let phoneNumber = to;
  if (!phoneNumber.startsWith('+')) {
    phoneNumber = `+${phoneNumber}`;
  }

  // Remove the + prefix for txtmsg.lk API
  const cleanPhoneNumber = phoneNumber.replace('+', '');

  const params = new URLSearchParams({
    apikey: TXTMSG_API_KEY,
    mobileno: cleanPhoneNumber,
    msg: body,
    ...(TXTMSG_SENDER_ID && { senderid: TXTMSG_SENDER_ID })
  });

  const response = await fetch(`https://txtmsg.lk/sms/send?${params.toString()}`, {
    method: 'GET' // txtmsg.lk typically uses GET requests
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`txtmsg.lk API error: ${errorText || response.statusText}`);
  }

  const result = await response.text();

  // txtmsg.lk typically returns a simple response like "Message sent successfully" or an ID
  return {
    sid: result.includes('success') ? `txtmsg_${Date.now()}` : result,
    status: 'sent',
    provider: 'txtmsg.lk'
  };
}
