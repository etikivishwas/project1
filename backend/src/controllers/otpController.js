const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/database');
const { sendOtpEmail } = require('../services/emailService');

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const SALT_ROUNDS = 10;

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

async function createAndSendOtp(email, purpose) {
  //console.log(`[OTP] Generating OTP for ${email}, purpose=${purpose}`);
  const otp = generateOtp();
  //console.log(`[OTP] Generated code: ${otp}`);
  const otp_hash = await bcrypt.hash(otp, SALT_ROUNDS);
  const expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // invalidate any previous unconsumed OTPs for this email+purpose
  await pool.query(
    'UPDATE otps SET consumed = TRUE WHERE email = ? AND purpose = ? AND consumed = FALSE',
    [email, purpose]
  );

  await pool.query(
    'INSERT INTO otps (email, otp_hash, purpose, expires_at) VALUES (?, ?, ?, ?)',
    [email, otp_hash, purpose, expires_at]
  );

  //console.log(`[OTP] Calling sendOtpEmail...`);
  await sendOtpEmail(email, otp, purpose);
  //console.log(`[OTP] sendOtpEmail completed without throwing.`);
}

exports.createAndSendOtp = createAndSendOtp;

// POST /api/auth/send-otp   { email, purpose: 'signup_verification' | 'password_reset' }
exports.sendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ message: 'Email and purpose are required.' });
    }
    if (!['signup_verification', 'password_reset'].includes(purpose)) {
      return res.status(400).json({ message: 'Invalid purpose.' });
    }

    const [users] = await pool.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);

    if (purpose === 'signup_verification') {
      if (users.length === 0) return res.status(404).json({ message: 'No account found for this email.' });
      if (users[0].is_verified) return res.status(400).json({ message: 'This account is already verified.' });
    }

    if (purpose === 'password_reset' && users.length === 0) {
      // Don't reveal account existence
      return res.status(200).json({ message: 'If an account exists, a code has been sent.' });
    }

    await createAndSendOtp(email, purpose);
    return res.status(200).json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ message: 'Failed to send verification code.' });
  }
};

// POST /api/auth/verify-otp   { email, otp, purpose }
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;
    if (!email || !otp || !purpose) {
      return res.status(400).json({ message: 'Email, otp, and purpose are required.' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM otps WHERE email = ? AND purpose = ? AND consumed = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [email, purpose]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No active code found. Please request a new one.' });
    }

    const record = rows[0];

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: 'This code has expired. Please request a new one.' });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many attempts. Please request a new code.' });
    }

    const match = await bcrypt.compare(otp, record.otp_hash);

    if (!match) {
      await pool.query('UPDATE otps SET attempts = attempts + 1 WHERE id = ?', [record.id]);
      return res.status(400).json({ message: 'Incorrect code.' });
    }

    await pool.query('UPDATE otps SET consumed = TRUE WHERE id = ?', [record.id]);

    if (purpose === 'signup_verification') {
      await pool.query('UPDATE users SET is_verified = TRUE WHERE email = ?', [email]);
    }

    // Issue a short-lived reset token for password_reset purpose so the
    // reset-password endpoint can't be called without having proven OTP ownership.
    let resetToken;
    if (purpose === 'password_reset') {
      resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = await bcrypt.hash(resetToken, SALT_ROUNDS);
      await pool.query(
        'INSERT INTO otps (email, otp_hash, purpose, expires_at, consumed) VALUES (?, ?, ?, ?, FALSE)',
        [email, resetTokenHash, 'password_reset_token', new Date(Date.now() + 10 * 60 * 1000)]
      );
    }

    return res.status(200).json({
      message: 'Verified successfully.',
      ...(resetToken ? { resetToken } : {})
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ message: 'Failed to verify code.' });
  }
};

// POST /api/auth/reset-password   { email, resetToken, newPassword }
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Email, resetToken, and newPassword are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const [rows] = await pool.query(
      `SELECT * FROM otps WHERE email = ? AND purpose = 'password_reset_token' AND consumed = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Reset session expired. Please start over.' });
    }

    const record = rows[0];
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Reset session expired. Please start over.' });
    }

    const match = await bcrypt.compare(resetToken, record.otp_hash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid reset session. Please start over.' });
    }

    await pool.query('UPDATE otps SET consumed = TRUE WHERE id = ?', [record.id]);

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [password_hash, email]);

    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Failed to reset password.' });
  }
};
