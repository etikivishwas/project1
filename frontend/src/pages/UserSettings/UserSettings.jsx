import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiBell,
  FiChevronRight,
  FiClock,
  FiHome,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
} from "react-icons/fi";
import "./UserSettings.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const footerItems = [
  { label: "Home", path: "/userScreen", icon: FiHome },
  { label: "Search", path: "/vendorSearch", icon: FiSearch },
  { label: "History", path: "/userHistory", icon: FiClock },
];

const SETTINGS_STORAGE_KEY = "tezoUserSettings";

const defaultSettings = {
  pushNotifications: true,
  emailUpdates: false,
  twoFactorEnabled: false,
  dataSharing: "standard",
  profileVisibility: "public",
};

const readStoredSettings = () => {
  const storedValue = localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (!storedValue) {
    return defaultSettings;
  }

  try {
    return {
      ...defaultSettings,
      ...JSON.parse(storedValue),
    };
  } catch {
    return defaultSettings;
  }
};

const getStoredToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

export default function UserSettings() {
  const navigate = useNavigate();
  const location = useLocation();

  const [settings, setSettings] = useState(readStoredSettings);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const token = getStoredToken();
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/user/settings`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          navigate("/login", { replace: true });
          return;
        }
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Settings could not be loaded.");
        }
        setSettings({ ...defaultSettings, ...result.data });
      } catch (error) {
        console.error("Settings load error:", error);
        setSaveMessage(error.message || "Settings could not be loaded.");
      } finally {
        setInitialLoading(false);
      }
    };

    loadSettings();
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = async (name, value) => {
    const previousSettings = settings;
    const nextSettings = {
      ...settings,
      [name]: value,
    };

    setSettings(nextSettings);
    setSaveMessage("");

    const token = getStoredToken();

    if (!token) {
      setSaveMessage("Preference saved on this device.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/api/user/settings`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          [name]: value,
        }),
      });

      if (response.status === 404) {
        setSaveMessage("Preference saved on this device.");
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Preference could not be saved.");
      }

      setSaveMessage(result.message || "Preference updated.");
    } catch (requestError) {
      console.error("Settings update error:", requestError);
      setSettings(previousSettings);
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(previousSettings)
      );
      setSaveMessage(requestError.message || "Preference could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token = getStoredToken();

    if (!token) {
      setDeleteError("Please log in again before deleting the account.");
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      const response = await fetch(`${API_URL}/api/user/account`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: deletePassword,
          confirmation: deleteConfirmation,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Account could not be deleted.");
      }

      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
      sessionStorage.clear();

      navigate("/login", { replace: true });
    } catch (requestError) {
      console.error("Delete account error:", requestError);
      setDeleteError(requestError.message || "Account could not be deleted.");
    } finally {
      setDeleting(false);
    }
  };

  const isFooterActive = (path) => {
    if (path === "/vendorSearch") {
      return location.pathname.startsWith("/vendorSearch");
    }

    if (path === "/userHistory") {
      return location.pathname.startsWith("/userHistory");
    }

    return location.pathname === path;
  };

  return (
    <>
      <div className="settings-page">
        <header className="settings-header">
          <button
            type="button"
            className="settings-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <FiArrowLeft />
          </button>

          <h1>Settings &amp; Privacy</h1>

          <span className="settings-header-space" />
        </header>

        <main className="settings-content">
          {initialLoading && (
            <p className="settings-save-message">
              <FiRefreshCw /> Loading settings...
            </p>
          )}
          <section className="settings-card">
            <div className="settings-card-title">
              <FiBell />
              <h2>Notifications</h2>
            </div>

            <div className="settings-row">
              <div className="settings-row-copy">
                <strong>Push Notifications</strong>
                <span>Alerts for new messages and leads</span>
              </div>

              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  disabled={saving}
                  onChange={(event) =>
                    updateSetting("pushNotifications", event.target.checked)
                  }
                  aria-label="Enable push notifications"
                />
                <span className="settings-switch-track">
                  <span className="settings-switch-thumb" />
                </span>
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-copy">
                <strong>Email Updates</strong>
                <span>Weekly summaries and platform news</span>
              </div>

              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={settings.emailUpdates}
                  disabled={saving}
                  onChange={(event) =>
                    updateSetting("emailUpdates", event.target.checked)
                  }
                  aria-label="Enable email updates"
                />
                <span className="settings-switch-track">
                  <span className="settings-switch-thumb" />
                </span>
              </label>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-title">
              <FiLock />
              <h2>Account Security</h2>
            </div>

            <button
              type="button"
              className="settings-link-row"
              onClick={() =>
                navigate(
                  "/userSettings/changePassword"
                )
              }
            >
              <span className="settings-row-copy">
                <strong>
                  Change Password
                </strong>

                <span>
                  Update your login credentials
                </span>
              </span>

              <FiChevronRight />
            </button>

            <button
              type="button"
              className="settings-link-row"
              onClick={() =>
                navigate(
                  "/userSettings/twoFactorAuthentication"
                )
              }
            >
              <span className="settings-row-copy">
                <strong>
                  Two-Factor Authentication
                </strong>

                <span>
                  {settings.twoFactorEnabled
                    ? "Currently enabled"
                    : "Currently disabled"}
                </span>
              </span>

              <FiChevronRight />
            </button>
          </section>

          <section className="settings-card">
            <div className="settings-card-title">
              <FiShield />
              <h2>Privacy Settings</h2>
            </div>

            <button
              type="button"
              className="settings-link-row"
              onClick={() => navigate("/dataSharing")}
            >
              <span className="settings-row-copy">
                <strong>Data Sharing</strong>
                <span>Manage how your data is used</span>
              </span>
              <FiChevronRight />
            </button>

            <button
              type="button"
              className="settings-link-row"
              onClick={() => navigate("/profileVisibility")}
            >
              <span className="settings-row-copy">
                <strong>Profile Visibility</strong>
                <span>
                  {settings.profileVisibility === "public" ? "Public" : "Private"}
                </span>
              </span>
              <FiChevronRight />
            </button>
          </section>

          {saveMessage && (
            <p className="settings-save-message" role="status">
              {saving && <FiRefreshCw />}
              {saveMessage}
            </p>
          )}

          <button
            type="button"
            className="delete-account-button"
            onClick={() => {
              setDeleteError("");
              setDeleteOpen(true);
            }}
          >
            <FiTrash2 />
            <span>Delete Account</span>
          </button>
        </main>
      </div>

      <div className="settings-bottom-viewport">
        <nav className="settings-bottom-navigation" aria-label="Primary navigation">
          {footerItems.map(({ label, path, icon: Icon }) => {
            const active = isFooterActive(path);

            return (
              <button
                type="button"
                key={path}
                className={`settings-nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => location.pathname !== path && navigate(path)}
              >
                <span className="settings-nav-icon">
                  <Icon />
                </span>
                <span className="settings-nav-label">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {deleteOpen && (
        <div
          className="delete-modal-backdrop"
          onMouseDown={() => !deleting && setDeleteOpen(false)}
        >
          <section
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="delete-modal-icon">
              <FiTrash2 />
            </span>

            <h2 id="delete-account-title">Delete account?</h2>
            <p>
              This permanently removes the account and cannot be undone.
            </p>

            {deleteError && <p className="delete-modal-error">{deleteError}</p>}

            <label className="delete-modal-field">
              Current password
              <input
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
              />
            </label>

            <label className="delete-modal-field">
              Type DELETE to confirm
              <input
                type="text"
                autoComplete="off"
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
              />
            </label>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel"
                disabled={deleting}
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm"
                disabled={
                  deleting ||
                  !deletePassword ||
                  deleteConfirmation !== "DELETE"
                }
                onClick={handleDeleteAccount}
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
