import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiBookmark,
  FiChevronRight,
  FiClock,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMail,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import logo from "../../assets/logo.jpeg";
import "./UserProfile.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const profileMenuItems = [
  {
    label: "Service History",
    description: "Review previous service interactions",
    icon: FiClock,
    path: "/userHistory",
  },
  {
    label: "Saved Providers",
    description: "View providers saved for later",
    icon: FiBookmark,
    path: "/savedProviders",
  },
  {
    label: "Settings & Privacy",
    description: "Manage account and privacy preferences",
    icon: FiSettings,
    path: "/userSettings",
  },
  {
    label: "Help & Support",
    description: "Get assistance or contact support",
    icon: FiHelpCircle,
    path: "/helpSupport",
  },
];

const footerItems = [
  { label: "Home", path: "/userScreen", icon: FiHome },
  { label: "Search", path: "/vendorSearch", icon: FiSearch },
  { label: "History", path: "/userHistory", icon: FiClock },
];

const getStoredToken = () =>
  localStorage.getItem(
    "accessToken"
  ) ||
  localStorage.getItem(
    "token"
  ) ||
  localStorage.getItem(
    "authToken"
  ) ||
  sessionStorage.getItem(
    "accessToken"
  ) ||
  sessionStorage.getItem(
    "token"
  ) ||
  "";

const getStoredUser = () => {
  const value =
    localStorage.getItem("user") || sessionStorage.getItem("user");

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getInitials = (name) => {
  if (!name?.trim()) {
    return "U";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export default function UserProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCurrentUser = useCallback(async () => {
    const token = getStoredToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to load profile.");
      }

      const currentUser = data.user || data.data || data;
      setUser(currentUser);

      const storage = localStorage.getItem("token")
        ? localStorage
        : sessionStorage;
      storage.setItem("user", JSON.stringify(currentUser));
    } catch (requestError) {
      console.error("Failed to fetch current user:", requestError);

      if (!user) {
        setError(requestError.message || "Failed to load profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, user]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const handleLogout = () => {
    localStorage.removeItem(
      "accessToken"
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "authToken"
    );

    localStorage.removeItem(
      "user"
    );

    sessionStorage.removeItem(
      "accessToken"
    );

    sessionStorage.removeItem(
      "token"
    );

    sessionStorage.removeItem(
      "user"
    );

    navigate(
      "/login",
      {
        replace: true,
      }
    );
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

  if (loading && !user) {
    return (
      <div className="profile-page profile-state-page">
        <header className="profile-header">
          <button
            type="button"
            className="profile-back-button"
            onClick={() => navigate("/userScreen")}
            aria-label="Go to home"
          >
            <FiArrowLeft />
          </button>
          <div className="profile-header-brand">
            <img src={logo} alt="Milieu Global" />
            <span>My Profile</span>
          </div>
          <span className="profile-header-spacer" />
        </header>

        <main className="profile-content">
          <section className="profile-loading-card">
            <span className="profile-skeleton-avatar" />
            <span className="profile-skeleton-line wide" />
            <span className="profile-skeleton-line short" />
          </section>
        </main>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile-page profile-state-page">
        <header className="profile-header">
          <button
            type="button"
            className="profile-back-button"
            onClick={() => navigate("/userScreen")}
            aria-label="Go to home"
          >
            <FiArrowLeft />
          </button>
          <div className="profile-header-brand">
            <img src={logo} alt="Milieu Global" />
            <span>My Profile</span>
          </div>
          <span className="profile-header-spacer" />
        </header>

        <main className="profile-content">
          <section className="profile-error-card">
            <span className="profile-error-icon">
              <FiRefreshCw />
            </span>
            <h2>Profile could not be loaded</h2>
            <p>{error}</p>
            <button type="button" onClick={fetchCurrentUser}>
              Try again
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="profile-page">
        <header className="profile-header">
          <button
            type="button"
            className="profile-back-button"
            onClick={() => navigate("/userScreen")}
            aria-label="Go to home"
          >
            <FiArrowLeft />
          </button>

          <div className="profile-header-brand">
            <img src={logo} alt="Milieu Global" />
            <span>My Profile</span>
          </div>

          <span className="profile-header-spacer" />
        </header>

        <main className="profile-content">
          <section className="profile-hero-card">
            <div className="profile-hero-decoration" />

            <div className="profile-avatar-ring">
              {user?.avatarUrl || user?.avatar_url || user?.profileImage ? (
                <img
                  src={
                    user.avatarUrl || user.avatar_url || user.profileImage
                  }
                  alt="User profile"
                />
              ) : (
                <span>{getInitials(user?.name)}</span>
              )}
            </div>

            <h1>{user?.name || "User"}</h1>

            {user?.email && (
              <p className="profile-email">
                <FiMail />
                <span>{user.email}</span>
              </p>
            )}

            <div className="profile-security-chip">
              <FiShield /> Verified account
            </div>
          </section>

          <section className="profile-section">
            <div className="profile-section-heading">
              <div>
                <small>YOUR ACCOUNT</small>
                <h2>Manage profile</h2>
              </div>
            </div>

            <div className="profile-menu">
              {profileMenuItems.map(
                ({ label, description, icon: Icon, path }, index) => (
                  <button
                    type="button"
                    className="profile-menu-item"
                    key={label}
                    onClick={() => navigate(path)}
                    style={{ "--profile-item-index": index }}
                  >
                    <span className="profile-menu-icon">
                      <Icon />
                    </span>

                    <span className="profile-menu-copy">
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>

                    <FiChevronRight className="profile-menu-arrow" />
                  </button>
                )
              )}
            </div>
          </section>

          { <section className="vendor-cta">
            <span className="vendor-cta-icon">
              <FaStore />
            </span>

            <div className="vendor-cta-copy">
              <small>GROW YOUR BUSINESS</small>
              <h2>Join as a Vendor</h2>
              <p>
                List services, reach nearby customers, and manage enquiries in
                one place.
              </p>
            </div>

            <button
              type="button"
              className="vendor-get-started"
              onClick={() => navigate("/vendorRegistration")}
            >
              Get started <FiChevronRight />
            </button>
          </section> }

          <button type="button" className="logout-button" onClick={handleLogout}>
            <FiLogOut />
            <span>Log out</span>
          </button>

          <p className="profile-version">Milieu Global customer app</p>
        </main>
      </div>

      <div className="profile-bottom-viewport">
        <nav className="profile-bottom-navigation" aria-label="Primary navigation">
          {footerItems.map(({ label, path, icon: Icon }) => {
            const active = isFooterActive(path);

            return (
              <button
                type="button"
                key={path}
                className={`profile-nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (location.pathname !== path) {
                    navigate(path);
                  }
                }}
              >
                <span className="profile-nav-icon">
                  <Icon />
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
