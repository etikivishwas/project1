import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendOtp } from '../api';
import '../pages/LoginPage/Login.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(email.trim(), 'password_reset');
      navigate('/verify-otp', { state: { email: email.trim(), purpose: 'password_reset' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-main">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Forgot Password</h1>
          <p className="login-subtitle">Enter your email and we'll send you a code to reset your password.</p>
        </div>

        {error && <div className="banner error">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="email">Email</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">mail</span>
              <input
                id="email"
                type="email"
                className="text-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            <span>{loading ? 'Sending...' : 'Send Code'}</span>
          </button>
        </form>

        <p className="footer-text">
          <Link className="footer-link" to="/login">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
