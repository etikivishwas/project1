import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
} from "react-icons/fi";
import "./ChangePassword.css";

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

const clearSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  sessionStorage.clear();
};

export default function ChangePassword() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [visible, setVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const toggleVisibility = (field) => {
    setVisible((current) => ({ ...current, [field]: !current[field] }));
  };

  const validate = () => {
    if (!form.currentPassword) return "Enter your current password.";
    if (!form.newPassword) return "Enter a new password.";
    if (form.newPassword.length < 10) {
      return "New password must contain at least 10 characters.";
    }
    if (!/[A-Z]/.test(form.newPassword)) {
      return "New password must include an uppercase letter.";
    }
    if (!/[a-z]/.test(form.newPassword)) {
      return "New password must include a lowercase letter.";
    }
    if (!/\d/.test(form.newPassword)) {
      return "New password must include a number.";
    }
    if (!/[^A-Za-z0-9]/.test(form.newPassword)) {
      return "New password must include a symbol.";
    }
    if (form.currentPassword === form.newPassword) {
      return "New password must differ from the current password.";
    }
    if (form.newPassword !== form.confirmPassword) {
      return "New password and confirmation do not match.";
    }
    return "";
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const token = getStoredToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/api/user/password`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        clearSession();
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Password could not be changed.");
      }

      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess(result.message || "Password changed successfully.");

      window.setTimeout(() => {
        clearSession();
        navigate("/login", {
          replace: true,
          state: { message: "Password changed. Sign in with your new password." },
        });
      }, 1600);
    } catch (requestError) {
      console.error("Change password error:", requestError);
      setError(requestError.message || "Password could not be changed.");
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { name: "currentPassword", label: "Current Password", autoComplete: "current-password" },
    { name: "newPassword", label: "New Password", autoComplete: "new-password" },
    { name: "confirmPassword", label: "Confirm New Password", autoComplete: "new-password" },
  ];

  return (
    <div className="change-password-page">
      <header className="change-password-header">
        <button
          type="button"
          onClick={() => navigate("/userSettings")}
          aria-label="Back to settings"
        >
          <FiArrowLeft />
        </button>
        <h1>Change Password</h1>
        <span />
      </header>

      <main className="change-password-content">
        <section className="change-password-card">
          <span className="change-password-lock">
            <FiLock />
          </span>
          <h2>Update your password</h2>
          <p>
            Use a strong password that you do not use for another account.
          </p>

          <form onSubmit={submitPassword} noValidate>
            {fields.map((field) => (
              <label key={field.name} htmlFor={field.name}>
                {field.label}
                <span className="password-input-wrap">
                  <input
                    id={field.name}
                    name={field.name}
                    type={visible[field.name] ? "text" : "password"}
                    autoComplete={field.autoComplete}
                    value={form[field.name]}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility(field.name)}
                    aria-label={`${visible[field.name] ? "Hide" : "Show"} ${field.label}`}
                    disabled={submitting}
                  >
                    {visible[field.name] ? <FiEyeOff /> : <FiEye />}
                  </button>
                </span>
              </label>
            ))}

            <div className="password-requirements">
              <strong>Password requirements</strong>
              <span>At least 10 characters</span>
              <span>Uppercase and lowercase letters</span>
              <span>At least one number and one symbol</span>
            </div>

            {error && <p className="change-password-error" role="alert">{error}</p>}
            {success && (
              <p className="change-password-success" role="status">
                <FiCheckCircle /> {success}
              </p>
            )}

            <button
              type="submit"
              className="change-password-submit"
              disabled={submitting || Boolean(success)}
            >
              {submitting ? "Updating password..." : "Update Password"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
