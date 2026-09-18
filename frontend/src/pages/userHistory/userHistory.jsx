import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiHome,
  FiMessageSquare,
  FiRefreshCw,
  FiSearch,
  FiUser,
} from "react-icons/fi";
import logo from "../../assets/logo.jpeg";
import "./userHistory.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fallbackImage =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80";

const filters = [
  { value: "all", label: "All Services" },
  { value: "completed", label: "Completed" },
  { value: "contacted", label: "Contacted" },
];

const footerItems = [
  { label: "Home", path: "/userScreen", icon: FiHome },
  { label: "Search", path: "/vendorSearch", icon: FiSearch },
  { label: "History", path: "/userHistory", icon: FiClock },
];

const getStoredUserId = () => {
  const storedUser =
    localStorage.getItem("user") || sessionStorage.getItem("user");

  if (!storedUser) {
    return 1;
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    return Number(parsedUser.id || parsedUser.userId) || 1;
  } catch {
    return 1;
  }
};

const formatServiceDate = (value) => {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getStatusText = (status) => {
  const labels = {
    requested: "Requested",
    contacted: "Contacted",
    confirmed: "Confirmed",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status] || "Requested";
};

const getActionText = (status) => {
  if (status === "completed" || status === "cancelled") {
    return "Contact Again";
  }

  if (status === "contacted") {
    return "Follow Up";
  }

  return "View Details";
};

export default function UserHistory() {
  const navigate = useNavigate();
  const location = useLocation();

  const [historyData, setHistoryData] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const userId = getStoredUserId();
      const response = await fetch(
        `${API_URL}/api/history?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load service history.");
      }

      setHistoryData(Array.isArray(result.data) ? result.data : []);
    } catch (requestError) {
      console.error("Failed to fetch service history:", requestError);
      setHistoryData([]);
      setError(requestError.message || "Failed to load service history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    if (activeFilter === "all") {
      return historyData;
    }

    return historyData.filter((item) => item.status === activeFilter);
  }, [historyData, activeFilter]);

  const handleHistoryAction = (item) => {
    if (item.vendorId) {
      navigate(`/vendor/${item.vendorId}`);
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
      <div className="history-app">
        <header className="history-header">
          <button
            type="button"
            className="history-brand"
            onClick={() => navigate("/userScreen")}
            aria-label="Milieu Global home"
          >
            <span className="history-logo">
              <img src={logo} alt="Milieu Global" />
            </span>

            <span className="history-brand-copy">
              <strong>Milieu Global</strong>
              <small>Trusted local services</small>
            </span>
          </button>

          <button
            type="button"
            className="history-profile-button"
            aria-label="Open profile"
            onClick={() => navigate("/userProfile")}
          >
            <FiUser />
          </button>
        </header>

        <main className="history-content">
          <section className="history-intro">
            <span className="history-eyebrow">YOUR ACTIVITY</span>
            <h1>Service History</h1>
            <p>
              Review past interactions and reconnect with trusted service
              providers.
            </p>
          </section>

          <div className="history-filters" aria-label="History filters">
            {filters.map((filter) => (
              <button
                type="button"
                key={filter.value}
                className={`history-filter ${
                  activeFilter === filter.value ? "active" : ""
                }`}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <section className="history-list">
            {loading && (
              <div className="history-loading" aria-label="Loading history">
                {[1, 2, 3].map((item) => (
                  <div className="history-skeleton-card" key={item}>
                    <span className="history-skeleton-image" />
                    <span className="history-skeleton-lines">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="history-empty error">
                <span className="history-empty-icon">
                  <FiRefreshCw />
                </span>
                <h2>History could not be loaded</h2>
                <p>{error}</p>
                <button type="button" onClick={fetchHistory}>
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && filteredHistory.length === 0 && (
              <div className="history-empty">
                <span className="history-empty-icon">
                  <FiClock />
                </span>
                <h2>No service history found</h2>
                <p>Your service interactions will appear here.</p>
                <button type="button" onClick={() => navigate("/vendorSearch")}>
                  Find a provider
                </button>
              </div>
            )}

            {!loading &&
              !error &&
              filteredHistory.map((item, index) => (
                <article
                  className="history-card"
                  key={item.id}
                  style={{ "--history-index": index }}
                >
                  <div className="history-card-main">
                    <div className="history-image-wrapper">
                      <img
                        src={item.image || fallbackImage}
                        alt={item.vendorName || "Service provider"}
                        className="history-vendor-image"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = fallbackImage;
                        }}
                      />
                    </div>

                    <div className="history-vendor-details">
                      <div className="history-vendor-row">
                        <h2>{item.vendorName || "Service Provider"}</h2>

                        <span className={`history-status ${item.status}`}>
                          {item.status === "completed" && <FiCheckCircle />}
                          {getStatusText(item.status)}
                        </span>
                      </div>

                      <p className="history-service-name">
                        {item.serviceName || "General Service"}
                      </p>
                    </div>
                  </div>

                  <div className="history-divider" />

                  <div className="history-card-bottom">
                    <div className="history-date">
                      <FiCalendar />
                      <span>{formatServiceDate(item.serviceDate)}</span>
                    </div>

                    <button
                      type="button"
                      className="history-action"
                      onClick={() => handleHistoryAction(item)}
                    >
                      {(item.status === "contacted" ||
                        item.status === "completed") && <FiMessageSquare />}
                      <span>{getActionText(item.status)}</span>
                      <FiArrowRight />
                    </button>
                  </div>
                </article>
              ))}
          </section>
        </main>
      </div>

      <div className="history-bottom-viewport">
        <nav className="history-bottom-navigation" aria-label="Primary navigation">
          {footerItems.map(({ label, path, icon: Icon }) => {
            const active = isFooterActive(path);

            return (
              <button
                type="button"
                key={path}
                className={`history-nav-item ${active ? "active" : ""}`}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (location.pathname !== path) {
                    navigate(path);
                  }
                }}
              >
                <span className="history-nav-icon">
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
