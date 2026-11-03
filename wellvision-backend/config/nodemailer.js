// Import nodemailer package to send emails from Node.js
import nodemailer from "nodemailer";
import config from "./config.js";


/*
|--------------------------------------------------------------------------
| Nodemailer Transporter Configuration
|--------------------------------------------------------------------------
| Sets up the email transporter using SMTP details.
| This transporter will be used to send emails such as verification OTPs,
| welcome emails, password reset OTPs, etc.
*/
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com', // SMTP server host (Brevo's relay server)
    port: 587,                    // SMTP port for TLS
    auth: {
        user: config.smtpUser,
        pass: config.smtpPass, // SMTP password from environment variables
    }
});

// Export the transporter for use in other files like authControllers.js
export default transporter;
