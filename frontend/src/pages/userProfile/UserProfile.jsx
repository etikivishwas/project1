import React from "react";
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
  FiMapPin,
} from "react-icons/fi";

import { FaStore } from "react-icons/fa";
import "./UserProfile.css";

function UserProfile() {
  const navigate = useNavigate();

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
    console.log("Search page not developed yet");
  };
  const handleHistory = () => {
    navigate("/userHistory");
  };
  const handleServiceHistory = () => {
    navigate("/userHistory");
  };
  const handleSavedProviders = () => {
    console.log("Saved Providers page not developed yet");
  };
  const handleSettings = () => {
    console.log("Settings & Privacy page not developed yet");
  };
  const handleHelp = () => {
    console.log("Help & Support page not developed yet");
  };
  const handleVendorRegistration = () => {
    console.log("Join as a Vendor page not developed yet");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/login");
  };

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
            TV
          </div>


          <h2>
            Teja Vasu
          </h2>


          <div className="profile-location">

            <FiMapPin />

            <span>
              Kondapur, Hyderabad
            </span>

          </div>

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
            onClick={handleHelp}
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

// import React from "react";

// function UserProfile() {

//   console.log("🔥🔥🔥 NEW USER PROFILE COMPONENT IS RUNNING 🔥🔥🔥");

//   return (
//     <div
//       style={{
//         background: "blue",
//         minHeight: "100vh",
//         width: "100%",
//         padding: "50px",
//         boxSizing: "border-box",
//       }}
//     >
//       <h1
//         style={{
//           color: "yellow",
//           fontSize: "40px",
//           fontWeight: "bold",
//         }}
//       >
//         TEST USER PROFILE
//       </h1>

//       <p style={{ color: "white", fontSize: "25px" }}>
//         THIS IS THE NEW FILE
//       </p>
//     </div>
//   );
// }

// export default UserProfile;