import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyOtp, sendOtp } from '../api';
import '../pages/LoginPage/Login.css';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const purpose = location.state?.purpose || 'signup_verification';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!email) {
      navigate(purpose === 'password_reset' ? '/forgot-password' : '/signup');
      return;
    }
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [email, navigate, purpose]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await verifyOtp(email, otp.trim(), purpose);
      if (purpose === 'signup_verification') {
        navigate('/login', { state: { justVerified: true } });
      } else {
        navigate('/reset-password', { state: { email, resetToken: data.resetToken } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    try {
      await sendOtp(email, purpose);
      setInfo('A new code has been sent.');
      setResendCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    }
  };

  return (
    <main className="login-main">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Verify your email</h1>
          <p className="login-subtitle">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
        </div>

        {error && <div className="banner error">{error}</div>}
        {info && <div className="banner success">{info}</div>}

        <form className="login-form" onSubmit={handleVerify} noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="otp">Verification Code</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">pin</span>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="text-input"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            <span>{loading ? 'Verifying...' : 'Verify'}</span>
          </button>
        </form>

        <p className="footer-text">
          Didn't get a code?{' '}
          {resendCooldown > 0 ? (
            <span>Resend in {resendCooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Resend code
            </button>
          )}
        </p>

        <p className="footer-text">
          <Link className="footer-link" to="/login">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
