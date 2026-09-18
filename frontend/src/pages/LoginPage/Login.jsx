import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { googleLogin, login } from "../../api.js";
import logo from "../../assets/logo.jpeg";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnRef = useRef(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const finishLogin = (data, storage = localStorage) => {
    storage.setItem("token", data.token);
    storage.setItem("user", JSON.stringify(data.user));

    const requestedPath = location.state?.from?.pathname;

    navigate(requestedPath || "/userScreen", {
      replace: true,
    });
  };

  const handleGoogleResponse = async (response) => {
    setServerError("");

    try {
      const { data } = await googleLogin(response.credential);
      finishLogin(data, localStorage);
    } catch (error) {
      setServerError(
        error.response?.data?.message || "Google sign-in failed."
      );
    }
  };

  useEffect(() => {
    const existingToken =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (existingToken) {
      navigate("/userScreen", { replace: true });
      return;
    }

    if (!window.google || !googleBtnRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      width: Math.min(window.innerWidth - 64, 416),
      text: "continue_with",
      shape: "rectangular",
    });
  }, []);

  const validate = () => {
    const nextErrors = {};

    if (!identifier.trim()) {
      nextErrors.identifier = "Email or mobile number is required.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const { data } = await login(
        identifier.trim(),
        password,
        rememberMe
      );

      finishLogin(data, rememberMe ? localStorage : sessionStorage);
    } catch (error) {
      const data = error.response?.data;

      if (data?.unverified) {
        navigate("/verify-otp", {
          replace: true,
          state: {
            email: data.email,
            purpose: "signup_verification",
          },
        });
        return;
      }

      setServerError(data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-main">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-header">
          <div className="login-logo-shell">
            <img
              className="login-logo"
              src={logo}
              alt="Milieu Global"
            />
          </div>

          <div>
            <p className="login-eyebrow">MILIEU GLOBAL</p>
            <h1 id="login-title" className="login-title">
              Welcome back
            </h1>
            <p className="login-subtitle">
              Log in to find and connect with verified service providers.
            </p>
          </div>
        </header>

        {serverError && (
          <div className="banner error" role="alert">
            <span className="material-symbols-outlined">error</span>
            <span>{serverError}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="identifier">
              Email or mobile number
            </label>

            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">
                person
              </span>
              <input
                id="identifier"
                type="text"
                inputMode="email"
                autoComplete="username"
                className={`text-input ${errors.identifier ? "error" : ""}`}
                placeholder="Enter your email or mobile"
                value={identifier}
                onChange={(event) => {
                  setIdentifier(event.target.value);
                  setErrors((current) => ({ ...current, identifier: "" }));
                }}
                aria-invalid={Boolean(errors.identifier)}
              />
            </div>

            {errors.identifier && (
              <span className="field-error">{errors.identifier}</span>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">
              Password
            </label>

            <div className="input-wrapper">
              <span className="material-symbols-outlined input-icon">
                lock
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className={`text-input password-input ${errors.password ? "error" : ""}`}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((current) => ({ ...current, password: "" }));
                }}
                aria-invalid={Boolean(errors.password)}
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            {errors.password && (
              <span className="field-error">{errors.password}</span>
            )}
          </div>

          <div className="utilities-row">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <Link className="forgot-link" to="/forgot-password">
              Forgot password?
            </Link>
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            <span>{loading ? "Logging in..." : "Login"}</span>
            {!loading && (
              <span className="material-symbols-outlined submit-icon">
                arrow_forward
              </span>
            )}
          </button>
        </form>

        <div className="divider" aria-hidden="true">
          <div className="divider-line" />
          <span className="divider-text">Or continue with</span>
          <div className="divider-line" />
        </div>

        <div className="google-button-container" ref={googleBtnRef} />

        <p className="footer-text">
          Don&apos;t have an account?{" "}
          <Link className="footer-link" to="/signup">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
