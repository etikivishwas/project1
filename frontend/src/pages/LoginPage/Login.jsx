import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, googleLogin } from '../../api.js';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleResponse = async (response) => {
    setServerError('');
    try {
      const { data } = await googleLogin(response.credential);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/userScreen');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Google sign-in failed.');
    }
  };

  useEffect(() => {
    if (window.google && googleBtnRef.current) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width:  Math.min(window.innerWidth - 80, 400),
        text: 'continue_with'
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const errs = {};
    if (!identifier.trim()) errs.identifier = 'Email or mobile number is required.';
    if (!password) errs.password = 'Password is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await login(identifier.trim(), password, rememberMe);
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', data.token);
      storage.setItem('user', JSON.stringify(data.user));
      navigate('/userScreen');
    } catch (err) {
      const data = err.response?.data;
      if (data?.unverified) {
        navigate('/verify-otp', { state: { email: data.email, purpose: 'signup_verification' } });
        return;
      }
      setServerError(data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-main">
      <div className="login-card">
        <div className="login-header">
          <img
  className="login-logo"
  src="/logo.png"
  alt="Milieu Global Logo"
/>
          <h1 className="login-title">Welcome</h1>
          <p className="login-subtitle">Log in to find and connect with verified service providers.</p>
        </div>

        {serverError && <div className="banner error">{serverError}</div>}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="identifier">Email or Mobile Number</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">person</span>
              <input
                id="identifier"
                type="text"
                className={`text-input ${errors.identifier ? 'error' : ''}`}
                placeholder="Enter your email or mobile"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            {errors.identifier && <span className="field-error">{errors.identifier}</span>}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">lock</span>
              <input
                id="password"
                type="password"
                className={`text-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="utilities-row">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
            <Link className="forgot-link" to="/forgot-password">Forgot Password?</Link>
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            <span>{loading ? 'Logging in...' : 'Login'}</span>
            {!loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>}
          </button>
        </form>

        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">Or login with</span>
          <div className="divider-line" />
        </div>

        <button type="button" className="social-btn" onClick={() => alert('Hook up Google OAuth here')} style={{ display: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
        <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', width: '100%' }} />

        <p className="footer-text">
          Don't have an account? <Link className="footer-link" to="/signup">Sign Up</Link>
        </p>
      </div>
    </main>
  );
}