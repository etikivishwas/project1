const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/database');
const { createAndSendOtp } = require('./otpController');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
const isMobile = (str) => /^\+?[0-9]{7,15}$/.test(str);

const SALT_ROUNDS = 10;

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const email = isEmail(identifier) ? identifier : null;
    const mobile = isMobile(identifier) ? identifier : null;

    if (!email && !mobile) {
      return res.status(400).json({ message: 'Enter a valid email or mobile number.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? OR mobile = ?',
      [email, mobile]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this identifier already exists.' });
    }

    if (!email) {
      return res.status(400).json({ message: 'A valid email is required to verify your account.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.query(
      'INSERT INTO users (email, mobile, password_hash, is_verified) VALUES (?, ?, ?, FALSE)',
      [email, mobile, password_hash]
    );

    await createAndSendOtp(email, 'signup_verification');

    return res.status(201).json({
      message: 'Account created. Check your email for a verification code.',
      email
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error during signup.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { identifier, password, rememberMe } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required.' });
    }

    const field = isEmail(identifier) ? 'email' : 'mobile';

    const [rows] = await pool.query(
      `SELECT * FROM users WHERE ${field} = ? LIMIT 1`,
      [identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.', unverified: true, email: user.email });
    }

    if (rememberMe !== undefined) {
      await pool.query('UPDATE users SET remember_me = ? WHERE id = ?', [!!rememberMe, user.id]);
    }

    const expiresIn = rememberMe
      ? (process.env.JWT_REFRESH_EXPIRES_IN || '7d')
      : (process.env.JWT_EXPIRES_IN || '1h');

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn });

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: { id: user.id, email: user.email, mobile: user.mobile }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// GET /api/auth/me  (protected)
exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, mobile, created_at FROM users WHERE id = ?',
      [req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/auth/google   { credential }  -- credential is the Google ID token
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: 'Google account email is not verified.' });
    }

    let [rows] = await pool.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]);
    let user;

    if (rows.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO users (email, google_id, is_verified) VALUES (?, ?, TRUE)',
        [email, googleId]
      );
      user = { id: result.insertId, email };
    } else {
      user = rows[0];
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = ?, is_verified = TRUE WHERE id = ?', [googleId, user.id]);
      }
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });

    return res.status(200).json({
      message: 'Google login successful.',
      token,
      user: { id: user.id, email: user.email, mobile: user.mobile || null }
    });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(500).json({ message: 'Google sign-in failed.' });
  }
};