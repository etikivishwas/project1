import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api.js';
import '../pages/LoginPage/Login.css';

export default function Signup() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!identifier.trim()) errs.identifier = 'Email or mobile number is required.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await signup(identifier.trim(), password);
      navigate('/verify-otp', { state: { email: data.email, purpose: 'signup_verification' } });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-main">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Create Account</h1>
          <p className="login-subtitle">Join Milieu Global to find verified service providers.</p>
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
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">lock</span>
              <input
                id="confirmPassword"
                type="password"
                className={`text-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
          </button>
        </form>

        <p className="footer-text">
          Already have an account? <Link className="footer-link" to="/login">Log In</Link>
        </p>
      </div>
    </main>
  );
}
