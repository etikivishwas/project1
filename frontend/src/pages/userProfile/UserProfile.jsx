import React, {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FiArrowLeft,
  FiClock,
  FiBookmark,
  FiSettings,
  FiHelpCircle,
  FiChevronRight,
  FiLogOut,
  FiHome,
  FiSearch,
} from "react-icons/fi";

import { FaStore } from "react-icons/fa";

import "./UserProfile.css";

function UserProfile() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // API URL
  // =====================================================

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  // =====================================================
  // GET CURRENT TOKEN
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      sessionStorage.getItem("token")
    );
  };

  // =====================================================
  // FETCH CURRENT LOGGED-IN USER
  // =====================================================

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        // -------------------------------------------------
        // NO TOKEN
        // -------------------------------------------------

        if (!token) {
          navigate("/login");
          return;
        }

        // -------------------------------------------------
        // GET CURRENT USER
        // -------------------------------------------------

        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // -------------------------------------------------
        // TOKEN EXPIRED / INVALID
        // -------------------------------------------------

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");

          navigate("/login");
          return;
        }

        // -------------------------------------------------
        // OTHER ERROR
        // -------------------------------------------------

        if (!response.ok) {
          const errorData =
            await response.json().catch(() => ({}));

          throw new Error(
            errorData.message ||
              "Failed to load profile."
          );
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        const data = await response.json();

        setUser(data.user);

      } catch (err) {
        console.error(
          "Failed to fetch current user:",
          err
        );

        setError(
          err.message ||
            "Failed to load profile."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [navigate, API_URL]);

  // =====================================================
  // GET USER INITIALS
  // =====================================================

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    const parts = name
      .trim()
      .split(/\s+/);

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  // =====================================================
  // NAVIGATION HANDLERS
  // =====================================================

  const handleBack = () => {
    navigate("/userScreen");
  };

  const handleHome = () => {
    navigate("/userScreen");
  };

  const handleSearch = () => {
    console.log(
      "Search page not developed yet"
    );
  };

  const handleHistory = () => {
    navigate("/userHistory");
  };

  const handleServiceHistory = () => {
    navigate("/userHistory");
  };

  const handleHelpSupport = () => {
    navigate("/helpSupport");
  }

  const handleSavedProviders = () => {
    console.log(
      "Saved Providers page not developed yet"
    );
  };

  const handleSettings = () => {
    console.log(
      "Settings & Privacy page not developed yet"
    );
  };

  const handleVendorRegistration = () => {
    console.log(
      "Join as a Vendor page not developed yet"
    );
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    navigate("/login");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="profile-page">

        <header className="profile-header">
          <button
            className="profile-back-button"
            onClick={handleBack}
            aria-label="Go back"
          >
            <FiArrowLeft />
          </button>

          <h1>My Profile</h1>
        </header>

        <main className="profile-content">

          <section className="profile-info">

            <div className="profile-avatar">
              U
            </div>

            <h2>
              Loading...
            </h2>

          </section>

        </main>

      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="profile-page">

        <header className="profile-header">
          <button
            className="profile-back-button"
            onClick={handleBack}
            aria-label="Go back"
          >
            <FiArrowLeft />
          </button>

          <h1>My Profile</h1>
        </header>

        <main className="profile-content">

          <section className="profile-info">

            <div className="profile-avatar">
              U
            </div>

            <h2>
              Unable to load profile
            </h2>

            <p>
              {error}
            </p>

          </section>

        </main>

      </div>
    );
  }

  // =====================================================
  // PROFILE
  // =====================================================

  return (
    <div className="profile-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="profile-header">

        <button
          className="profile-back-button"
          onClick={handleBack}
          aria-label="Go back"
        >
          <FiArrowLeft />
        </button>

        <h1>
          My Profile
        </h1>

      </header>


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main className="profile-content">

        {/* =================================================
            PROFILE INFORMATION
            ================================================= */}

        <section className="profile-info">

          <div className="profile-avatar">
            {getInitials(user?.name)}
          </div>

          <h2>
            {user?.name || "User"}
          </h2>

        </section>


        {/* =================================================
            PROFILE MENU
            ================================================= */}

        <section className="profile-menu">

          {/* SERVICE HISTORY */}

          <button
            className="profile-menu-item"
            onClick={handleServiceHistory}
          >
            <div className="profile-menu-left">

              <FiClock />

              <span>
                Service History
              </span>

            </div>

            <FiChevronRight
              className="profile-menu-arrow"
            />

          </button>


          {/* SAVED PROVIDERS */}

          <button
            className="profile-menu-item"
            onClick={handleSavedProviders}
          >
            <div className="profile-menu-left">

              <FiBookmark />

              <span>
                Saved Providers
              </span>

            </div>

            <FiChevronRight
              className="profile-menu-arrow"
            />

          </button>


          {/* SETTINGS */}

          <button
            className="profile-menu-item"
            onClick={handleSettings}
          >
            <div className="profile-menu-left">

              <FiSettings />

              <span>
                Settings &amp; Privacy
              </span>

            </div>

            <FiChevronRight
              className="profile-menu-arrow"
            />

          </button>


          {/* HELP */}

          <button
            className="profile-menu-item"
            onClick={handleHelpSupport}
          >
            <div className="profile-menu-left">

              <FiHelpCircle />

              <span>
                Help &amp; Support
              </span>

            </div>

            <FiChevronRight
              className="profile-menu-arrow"
            />

          </button>

        </section>


        {/* =================================================
            JOIN AS VENDOR
            ================================================= */}

        <section className="vendor-cta">

          <div className="vendor-cta-title">

            <FaStore />

            <h2>
              Join as a Vendor
            </h2>

          </div>

          <p>
            List your services and reach more clients
            in your area.
          </p>

          <button
            className="vendor-get-started"
            onClick={handleVendorRegistration}
          >
            Get Started
          </button>

        </section>


        {/* =================================================
            LOGOUT
            ================================================= */}

        <button
          className="logout-button"
          onClick={handleLogout}
        >

          <FiLogOut />

          <span>
            Log Out
          </span>

        </button>

      </main>


      {/* =================================================
          BOTTOM NAVIGATION
          ================================================= */}

      <nav className="profile-bottom-navigation">

        {/* HOME */}

        <button
          className="profile-nav-item"
          onClick={handleHome}
        >
          <FiHome />

          <span>
            Home
          </span>

        </button>


        {/* SEARCH */}

        <button
          className="profile-nav-item"
          onClick={handleSearch}
        >
          <FiSearch />

          <span>
            Search
          </span>

        </button>


        {/* HISTORY */}

        <button
          className="profile-nav-item"
          onClick={handleHistory}
        >
          <FiClock />

          <span>
            History
          </span>

        </button>

      </nav>

    </div>
  );
}

export default UserProfile;