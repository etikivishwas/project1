import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api.js';
import '../pages/LoginPage/Login.css';

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};

    // Name validation
    if (!name.trim()) {
      errs.name = 'Name is required.';
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }

    // Email validation
    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Enter a valid email address.';
    }

    // Mobile validation
    if (!mobile.trim()) {
      errs.mobile = 'Mobile number is required.';
    } else if (!/^\+?[0-9]{7,15}$/.test(mobile.trim())) {
      errs.mobile = 'Enter a valid mobile number.';
    }

    // Password validation
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    // Confirm password validation
    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);

    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const { data } = await signup(
        name.trim(),
        email.trim(),
        mobile.trim(),
        password
      );

      navigate('/verify-otp', {
        state: {
          email: data.email,
          purpose: 'signup_verification'
        }
      });
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        'Signup failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-main">
      <div className="login-card">

        <div className="login-header">
          <h1 className="login-title">Create Account</h1>

          <p className="login-subtitle">
            Join Milieu Global to find verified service providers.
          </p>
        </div>

        {serverError && (
          <div className="banner error">
            {serverError}
          </div>
        )}

        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >

          {/* NAME */}
          <div className="field-group">
            <label
              className="field-label"
              htmlFor="name"
            >
              Full Name
            </label>

            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">
                person
              </span>

              <input
                id="name"
                type="text"
                className={`text-input ${
                  errors.name ? 'error' : ''
                }`}
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            {errors.name && (
              <span className="field-error">
                {errors.name}
              </span>
            )}
          </div>


          {/* EMAIL */}
          <div className="field-group">
            <label
              className="field-label"
              htmlFor="email"
            >
              Email Address
            </label>

            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">
                mail
              </span>

              <input
                id="email"
                type="email"
                className={`text-input ${
                  errors.email ? 'error' : ''
                }`}
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {errors.email && (
              <span className="field-error">
                {errors.email}
              </span>
            )}
          </div>


          {/* MOBILE */}
          <div className="field-group">
            <label
              className="field-label"
              htmlFor="mobile"
            >
              Mobile Number
            </label>

            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">
                phone
              </span>

              <input
                id="mobile"
                type="tel"
                className={`text-input ${
                  errors.mobile ? 'error' : ''
                }`}
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                autoComplete="tel"
              />
            </div>

            {errors.mobile && (
              <span className="field-error">
                {errors.mobile}
              </span>
            )}
          </div>


          {/* PASSWORD */}
          <div className="field-group">
            <label
              className="field-label"
              htmlFor="password"
            >
              Password
            </label>

            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">
                lock
              </span>

              <input
                id="password"
                type="password"
                className={`text-input ${
                  errors.password ? 'error' : ''
                }`}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {errors.password && (
              <span className="field-error">
                {errors.password}
              </span>
            )}
          </div>


          {/* CONFIRM PASSWORD */}
          <div className="field-group">
            <label
              className="field-label"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>

            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">
                lock
              </span>

              <input
                id="confirmPassword"
                type="password"
                className={`text-input ${
                  errors.confirmPassword ? 'error' : ''
                }`}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                autoComplete="new-password"
              />
            </div>

            {errors.confirmPassword && (
              <span className="field-error">
                {errors.confirmPassword}
              </span>
            )}
          </div>


          {/* SUBMIT */}
          <button
            className="submit-btn"
            type="submit"
            disabled={loading}
          >
            <span>
              {loading ? 'Creating account...' : 'Sign Up'}
            </span>
          </button>

        </form>


        <p className="footer-text">
          Already have an account?{' '}
          <Link
            className="footer-link"
            to="/login"
          >
            Log In
          </Link>
        </p>

      </div>
    </main>
  );
}