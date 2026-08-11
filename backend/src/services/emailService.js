const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

async function sendOtpEmail(toEmail, otp, purpose) {
  const isSignup = purpose === 'signup_verification';
  const subject = isSignup ? 'Verify your Milieu Global account' : 'Reset your Milieu Global password';
  const heading = isSignup ? 'Verify your email' : 'Reset your password';
  const body = isSignup
    ? 'Use the code below to verify your email address and finish creating your account.'
    : 'Use the code below to reset your password.';

  const html = `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #041627;">${heading}</h2>
      <p style="color: #44474c;">${body}</p>
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; background: #eff4ff; padding: 16px 24px; border-radius: 8px; text-align: center; color: #041627; margin: 24px 0;">
        ${otp}
      </div>
      <p style="color: #74777d; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Milieu Global" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject,
    html
  });
}

module.exports = { sendOtpEmail };