import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClipboard,
  FiKey,
  FiRefreshCw,
  FiShield,
  FiSmartphone,
} from "react-icons/fi";
import "./TwoFactorAuthentication.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const getStoredToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

const readJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, message: "The server returned an invalid response." };
  }
};

export default function TwoFactorAuthentication() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const authenticatedFetch = async (path, options = {}) => {
    const token = getStoredToken();
    if (!token) {
      navigate("/login", { replace: true });
      throw new Error("Authentication is required.");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const result = await readJson(response);
    if (response.status === 401 || response.status === 403) {
      navigate("/login", { replace: true });
      throw new Error(result.message || "Your session has expired.");
    }
    if (!response.ok || !result.success) {
      throw new Error(result.message || "The request could not be completed.");
    }
    return result;
  };

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const result = await authenticatedFetch("/api/user/settings");
        setEnabled(Boolean(result.data?.twoFactorEnabled));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };
    loadStatus();
  }, []);

  const startSetup = async () => {
    try {
      setBusy(true);
      setError("");
      setMessage("");
      const result = await authenticatedFetch("/api/user/two-factor/setup", {
        method: "POST",
      });
      setSetup(result.data);
      setCode("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from the authenticator app.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const result = await authenticatedFetch("/api/user/two-factor/confirm", {
        method: "POST",
        body: JSON.stringify({ token: code }),
      });
      setEnabled(true);
      setSetup(null);
      setCode("");
      setMessage(result.message || "Two-factor authentication is enabled.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const disableTwoFactor = async (event) => {
    event.preventDefault();
    if (!password || !/^\d{6}$/.test(code)) {
      setError("Enter the current password and a valid six-digit code.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const result = await authenticatedFetch("/api/user/two-factor", {
        method: "DELETE",
        body: JSON.stringify({ password, token: code }),
      });
      setEnabled(false);
      setPassword("");
      setCode("");
      setMessage(result.message || "Two-factor authentication is disabled.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const copySecret = async () => {
    if (!setup?.secret) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setMessage("Setup key copied.");
    } catch {
      setError("The setup key could not be copied. Copy it manually.");
    }
  };

  return (
    <div className="tfa-page">
      <header className="tfa-header">
        <button type="button" onClick={() => navigate("/userSettings")} aria-label="Back to settings">
          <FiArrowLeft />
        </button>
        <h1>Two-Factor Authentication</h1>
        <span />
      </header>

      <main className="tfa-content">
        <section className="tfa-hero">
          <span><FiShield /></span>
          <h2>{enabled ? "Extra protection is active" : "Protect your account"}</h2>
          <p>
            Use an authenticator app to require a time-based verification code when signing in.
          </p>
          <div className={`tfa-status ${enabled ? "enabled" : "disabled"}`}>
            {enabled ? <FiCheckCircle /> : <FiKey />}
            {loading ? "Checking status..." : enabled ? "Enabled" : "Disabled"}
          </div>
        </section>

        {!loading && !enabled && !setup && (
          <section className="tfa-card">
            <div className="tfa-card-heading"><FiSmartphone /><h2>Set up authenticator</h2></div>
            <ol>
              <li>Install Microsoft Authenticator, Google Authenticator, or another TOTP app.</li>
              <li>Select Start setup below.</li>
              <li>Scan the QR code and enter the six-digit code.</li>
            </ol>
            <button className="tfa-primary" type="button" onClick={startSetup} disabled={busy}>
              {busy ? "Preparing setup..." : "Start setup"}
            </button>
          </section>
        )}

        {!enabled && setup && (
          <section className="tfa-card">
            <div className="tfa-card-heading"><FiSmartphone /><h2>Connect authenticator app</h2></div>
            <p className="tfa-help">Scan this QR code. If scanning is unavailable, enter the setup key manually.</p>

            {setup.qrCodeDataUrl && (
              <div className="tfa-qr"><img src={setup.qrCodeDataUrl} alt="Two-factor authenticator QR code" /></div>
            )}

            <div className="tfa-secret">
              <span><small>Setup key</small><strong>{setup.secret}</strong></span>
              <button type="button" onClick={copySecret} aria-label="Copy setup key"><FiClipboard /></button>
            </div>

            <form onSubmit={confirmSetup}>
              <label htmlFor="tfaCode">Six-digit verification code</label>
              <input
                id="tfaCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength="6"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
              />
              <button className="tfa-primary" type="submit" disabled={busy || code.length !== 6}>
                {busy ? "Verifying..." : "Verify and enable"}
              </button>
              <button className="tfa-secondary" type="button" disabled={busy} onClick={() => { setSetup(null); setCode(""); }}>
                Cancel
              </button>
            </form>
          </section>
        )}

        {!loading && enabled && (
          <section className="tfa-card">
            <div className="tfa-card-heading"><FiLock /><h2>Disable two-factor authentication</h2></div>
            <p className="tfa-help">For security, confirm the current password and a fresh authenticator code.</p>
            <form onSubmit={disableTwoFactor}>
              <label htmlFor="tfaPassword">Current password</label>
              <input
                id="tfaPassword"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <label htmlFor="disableTfaCode">Six-digit code</label>
              <input
                id="disableTfaCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength="6"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
              />
              <button className="tfa-danger" type="submit" disabled={busy || !password || code.length !== 6}>
                {busy ? "Disabling..." : "Disable two-factor authentication"}
              </button>
            </form>
          </section>
        )}

        {error && <p className="tfa-error" role="alert">{error}</p>}
        {message && <p className="tfa-success" role="status"><FiCheckCircle /> {message}</p>}
      </main>
    </div>
  );
}
