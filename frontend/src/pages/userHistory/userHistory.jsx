import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiUser,
  FiCalendar,
  FiArrowRight,
  FiMessageSquare,
  FiHome,
  FiSearch,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";

import api from "../../api";

import "./userHistory.css";


function UserHistory() {

  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [historyData, setHistoryData] = useState([]);

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // FETCH SERVICE HISTORY
  // =====================================================

  useEffect(() => {

    const fetchHistory = async () => {

      try {

        setLoading(true);

        setError("");


        const response = await api.get(
          "/history"
        );


        if (
          response.data &&
          response.data.success
        ) {

          setHistoryData(
            response.data.data || []
          );

        } else {

          setHistoryData([]);

          setError(
            "Unable to load service history."
          );

        }

      } catch (error) {

        console.error(
          "Failed to fetch service history:",
          error
        );


        setHistoryData([]);


        if (
          error.response &&
          error.response.status === 401
        ) {

          navigate("/login");

          return;
        }


        setError(
          error.response?.data?.message ||
          "Failed to load service history."
        );

      } finally {

        setLoading(false);

      }

    };


    fetchHistory();

  }, [navigate]);


  // =====================================================
  // FILTER HISTORY
  // =====================================================

  const filteredHistory =
    activeFilter === "all"
      ? historyData
      : historyData.filter(
          (item) =>
            item.status === activeFilter
        );


  // =====================================================
  // STATUS TEXT
  // =====================================================

  const getStatusText = (status) => {

    if (status === "completed") {
      return "Completed";
    }

    if (status === "contacted") {
      return "Contacted";
    }

    if (status === "confirmed") {
      return "Confirmed";
    }

    if (status === "cancelled") {
      return "Cancelled";
    }

    if (status === "in_progress") {
      return "In Progress";
    }

    return "Requested";
  };


  // =====================================================
  // ACTION TEXT
  // =====================================================

  const getActionText = (status) => {

    if (status === "completed") {
      return "Contact Again";
    }

    if (status === "contacted") {
      return "Follow Up";
    }

    if (status === "confirmed") {
      return "View Details";
    }

    if (status === "cancelled") {
      return "Contact Again";
    }

    return "View Details";
  };


  // =====================================================
  // HISTORY ACTION
  // =====================================================

  const handleHistoryAction = (item) => {

    console.log(
      "Selected history:",
      item
    );

    console.log(
      "Action:",
      getActionText(item.status)
    );

    // Action functionality can be connected
    // when the vendor/service details flow
    // is developed.
  };


  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleHomeClick = () => {

    navigate("/userScreen");

  };


  const handleSearchClick = () => {

    console.log(
      "Search page not developed yet"
    );

  };


  const handleHistoryClick = () => {

    navigate("/userHistory");

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="history-app">


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="history-header">

        <div className="history-brand">

          <div className="history-logo">
            MG
          </div>

          <span>
            LOCAL BIZZ
          </span>

        </div>


        <button
          className="history-profile-button"
          aria-label="Profile"
          onClick={() => navigate("/userProfile")}
        >
          <FiUser />
        </button>
      </header>

      {/* =================================================
          MAIN CONTENT
          ================================================= */}
      <main className="history-content">
        {/* =================================================
            PAGE TITLE
            ================================================= */}
        <section className="history-intro">
          <h1>
            Service History
          </h1>
          <p>
            Review your past interactions and easily
            re-book trusted service providers.
          </p>
        </section>

        {/* =================================================
            FILTERS
            ================================================= */}
        <div className="history-filters">
          <button
            className={
              `history-filter ${
                activeFilter === "all"
                  ? "active"
                  : ""
              }`
            }
            onClick={() =>
              setActiveFilter("all")
            }
          >
            All Services
          </button>
          <button
            className={
              `history-filter ${
                activeFilter === "completed"
                  ? "active"
                  : ""
              }`
            }
            onClick={() =>
              setActiveFilter("completed")
            }
          >
            Completed
          </button>
          <button
            className={
              `history-filter ${
                activeFilter === "contacted"
                  ? "active"
                  : ""
              }`
            }
            onClick={() =>
              setActiveFilter("contacted")
            }
          >
            Contacted
          </button>
        </div>
        {/* =================================================
            HISTORY LIST
            ================================================= */}

        <section className="history-list">
          {/* =================================================
              LOADING
              ================================================= */}

          {loading && (
            <div className="history-empty">
              <FiClock />
              <p>
                Loading service history...
              </p>
            </div>
          )}

          {/* =================================================
              ERROR
              ================================================= */}
          {!loading && error && (
            <div className="history-empty">
              <FiClock />
              <p>
                {error}
              </p>
            </div>
          )}

          {/* =================================================
              EMPTY
              ================================================= */}

          {!loading &&
            !error &&
            filteredHistory.length === 0 && (
              <div className="history-empty">
                <FiClock />
                <p>
                  No service history found.
                </p>
              </div>
          )}

          {/* =================================================
              HISTORY CARDS
              ================================================= */}

          {!loading &&
            !error &&
            filteredHistory.map((item) => (
              <article
                className="history-card"
                key={item.id}
              >

                {/* =========================================
                    TOP SECTION
                    ========================================= */}

                <div className="history-card-main">
                  {/* VENDOR IMAGE */}
                  <div className="history-image-wrapper">
                    <img
                      src={item.image}
                      alt={item.vendorName}
                      className="history-vendor-image"
                    />
                  </div>

                  {/* VENDOR DETAILS */}
                  <div className="history-vendor-details">
                    <div className="history-vendor-row">
                      <h2>
                        {item.vendorName}
                      </h2>
                      <span
                        className={
                          `history-status ${
                            item.status
                          }`
                        }
                      >
                        {item.status ===
                          "completed" && (
                          <FiCheckCircle />
                        )}
                        {getStatusText(
                          item.status
                        )}
                      </span>
                    </div>
                    <p className="history-service-name">
                      {item.serviceName}
                    </p>
                  </div>
                </div>
                {/* =========================================
                    DIVIDER
                    ========================================= */}

                <div className="history-divider"></div>
                {/* =========================================
                    BOTTOM SECTION
                    ========================================= */}
                <div className="history-card-bottom">
                  {/* DATE */}
                  <div className="history-date">
                    <FiCalendar />
                    <span>
                      {item.serviceDate}
                    </span>
                  </div>

                  {/* ACTION */}
                  <button
                    className="history-action"
                    onClick={() =>
                      handleHistoryAction(item)
                    }
                  >
                    {(item.status ===
                      "contacted" ||
                      item.status ===
                        "completed") && (

                      <FiMessageSquare />

                    )}
                    <span>
                      {getActionText(
                        item.status
                      )}
                    </span>
                    <FiArrowRight />
                  </button>
                </div>
              </article>
            ))}
        </section>
      </main>

      {/* =================================================
          BOTTOM NAVIGATION
          ================================================= */}
      <nav className="history-bottom-navigation">
        {/* HOME */}
        <button
          className="history-nav-item"
          onClick={handleHomeClick}
        >
          <FiHome />
          <span>
            Home
          </span>
        </button>

        {/* SEARCH */}

        <button
          className="history-nav-item"
          onClick={handleSearchClick}
        >
          <FiSearch />
          <span>
            Search
          </span>
        </button>
        {/* HISTORY */}
        <button
          className="history-nav-item active"
          onClick={handleHistoryClick}
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


export default UserHistory;