import React, { useEffect, useState } from "react";

import {
  FiSearch,
  FiUser,
  FiMapPin,
  FiMessageSquare,
  FiHome,
  FiClock,
  FiChevronRight,
  FiCheckCircle,
  FiStar,
  FiMoreHorizontal,
  FiArrowRight,
} from "react-icons/fi";

import {
  FaWrench,
  FaBolt,
  FaBroom,
  FaSpa,
  FaPaintRoller,
  FaTruckMoving,
  FaSnowflake,
} from "react-icons/fa";

import "./userScreen.css";


// =====================================================
// API URL
// =====================================================

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";


// =====================================================
// CATEGORIES
// =====================================================

const categories = [
  {
    id: 1,
    name: "Plumbing",
    icon: <FaWrench />,
  },
  {
    id: 2,
    name: "Electrical",
    icon: <FaBolt />,
  },
  {
    id: 3,
    name: "Cleaning",
    icon: <FaBroom />,
  },
  {
    id: 4,
    name: "Beauty",
    icon: <FaSpa />,
  },
  {
    id: 5,
    name: "Carpentry",
    icon: <FaPaintRoller />,
  },
  {
    id: 6,
    name: "Moving",
    icon: <FaTruckMoving />,
  },
  {
    id: 7,
    name: "HVAC",
    icon: <FaSnowflake />,
  },
  {
    id: 8,
    name: "More",
    icon: <FiMoreHorizontal />,
  },
];


// =====================================================
// FEATURED VENDORS
// =====================================================
// We will connect this section to the backend later.
// For now, keep the featured banner data separate.

const featuredVendors = [
  {
    id: 1,
    name: "Apex Electrical Pros",
    description: "24/7 Emergency Service",
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80",
    badge: "TOP RATED",
  },
  {
    id: 2,
    name: "Flow Plumbing Experts",
    description: "Fast & Reliable Plumbing",
    image:
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80",
    badge: "PREMIUM",
  },
];


// =====================================================
// USER SCREEN
// =====================================================

function UserScreen() {

  // ===================================================
  // STATE
  // ===================================================

  const [vendors, setVendors] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // ===================================================
  // FETCH VENDORS
  // ===================================================

  useEffect(() => {

    const fetchVendors = async () => {

      try {

        setLoading(true);

        setError("");


        const response = await fetch(
          `${API_URL}/api/vendors`
        );


        if (!response.ok) {

          throw new Error(
            `Failed to fetch vendors. Status: ${response.status}`
          );

        }


        const result = await response.json();


        console.log("Vendor API response:", result);


        if (result.success) {

          setVendors(result.data || []);

        } else {

          throw new Error(
            result.message || "Failed to fetch vendors"
          );

        }

      } catch (error) {

        console.error("Error fetching vendors:", error);

        setError(
          "Unable to load vendors. Please try again."
        );

      } finally {

        setLoading(false);

      }

    };


    fetchVendors();

  }, []);


  // ===================================================
  // CATEGORY CLICK
  // ===================================================

  const handleCategoryClick = (category) => {

    console.log(
      "Selected category:",
      category.name
    );

  };


  // ===================================================
  // SEARCH
  // ===================================================

  const handleSearch = (event) => {

    event.preventDefault();


    const searchValue =
      event.target.search.value.trim();


    if (!searchValue) {
      return;
    }


    console.log("Search:", searchValue);

  };


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div className="app-container">


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="home-header">

        <div className="brand">

          <div className="brand-logo">
            <span>M</span>
          </div>

          <h1>Milieu Global</h1>

        </div>


        <button
          className="profile-button"
          aria-label="Profile"
        >

          <FiUser />

        </button>

      </header>


      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main className="home-content">


        {/* =================================================
            SEARCH
            ================================================= */}

        <section className="search-section">

          <form
            className="search-box"
            onSubmit={handleSearch}
          >

            <FiSearch className="search-icon" />


            <input
              type="text"
              name="search"
              placeholder="Search for services, providers, or locations"
              autoComplete="off"
            />


            <button
              type="submit"
              className="search-submit"
              aria-label="Search"
            >

              <FiArrowRight />

            </button>

          </form>

        </section>


        {/* =================================================
            PREMIUM FEATURED
            ================================================= */}

        <section className="section">

          <div className="section-header">

            <h2>Premium Featured</h2>


            <button className="view-all-button">

              View All

              <FiChevronRight />

            </button>

          </div>


          <div className="featured-wrapper">

            <div className="featured-list">

              {featuredVendors.map((vendor) => (

                <article
                  className="featured-card"
                  key={vendor.id}
                >

                  <img
                    src={vendor.image}
                    alt={vendor.name}
                    className="featured-image"
                  />


                  <div className="featured-overlay"></div>


                  <div className="featured-content">

                    <div className="featured-badge">

                      <FiCheckCircle />

                      {vendor.badge}

                    </div>


                    <h3>
                      {vendor.name}
                    </h3>


                    <p>
                      {vendor.description}
                    </p>

                  </div>

                </article>

              ))}

            </div>

          </div>

        </section>


        {/* =================================================
            CATEGORIES
            ================================================= */}

        <section className="section categories-section">

          <div className="section-header">

            <h2>
              Browse Categories
            </h2>

          </div>


          <div className="category-grid">

            {categories.map((category) => (

              <button
                key={category.id}
                className="category-item"
                onClick={() =>
                  handleCategoryClick(category)
                }
              >

                <div className="category-icon">

                  {category.icon}

                </div>


                <span>
                  {category.name}
                </span>

              </button>

            ))}

          </div>

        </section>


        {/* =================================================
            VERIFIED VENDORS
            ================================================= */}

        <section className="section vendors-section">
          <div className="vendors-section-header">
            <h2>
              Top Verified Vendors Near You
            </h2>
          </div>
          {/* =================================================
              LOADING
              ================================================= */}

          {loading && (
            <div className="vendor-status">
              <p>
                Loading vendors...
              </p>
            </div>
          )}

          {/* =================================================
              ERROR
              ================================================= */}

          {!loading && error && (
            <div className="vendor-status error">
              <p>
                {error}
              </p>
            </div>
          )}


          {/* =================================================
              NO VENDORS
              ================================================= */}

          {!loading &&
            !error &&
            vendors.length === 0 && (
              <div className="vendor-status">
                <p>
                  No vendors available.
                </p>
              </div>
            )}

          {/* =================================================
              VENDOR LIST
              ================================================= */}

          {!loading &&
            !error &&
            vendors.length > 0 && (
              <div className="vendor-list">
                {vendors.map((vendor) => (
                  <article
                    className="vendor-card"
                    key={vendor.id}
                  >
                    <div className="vendor-top-border"></div>
                    <div className="vendor-main">
                      {/* VENDOR IMAGE */}
                      <img
                        src={vendor.image_url}
                        alt={vendor.name}
                        className="vendor-image"
                      />
                      <div className="vendor-details">
                        {/* NAME + RATING */}
                        <div className="vendor-title-row">
                          <h3>
                            {vendor.name}
                          </h3>
                          <div className="rating">
                            <FiStar />
                            <span>
                              {vendor.rating}
                            </span>
                          </div>
                        </div>
                        {/* SERVICE */}

                        <p className="vendor-service">
                          {vendor.service_type}
                        </p>
                        {/* META */}

                        <div className="vendor-meta">
                          {/* VERIFIED */}
                          {vendor.is_verified && (
                            <span className="verified">
                              <FiCheckCircle />
                              Verified
                            </span>
                          )}

                          {/* LOCATION */}

                          <span className="distance">

                            <FiMapPin />

                            {vendor.city ||
                              "Nearby"}

                          </span>


                        </div>

                      </div>

                    </div>


                    {/* =================================================
                        ACTIONS
                        ================================================= */}

                    <div className="vendor-actions">


                      <button
                        className="book-button"
                        onClick={() =>
                          console.log(
                            "Book vendor:",
                            vendor.id
                          )
                        }
                      >

                        Book Now

                      </button>


                      <button
                        className="contact-button"
                        onClick={() =>
                          console.log(
                            "Contact vendor:",
                            vendor.id
                          )
                        }
                      >

                        <FiMessageSquare />

                        Contact

                      </button>

                    </div>

                  </article>

                ))}

              </div>

            )}

        </section>

      </main>


      {/* =================================================
          BOTTOM NAVIGATION
          ================================================= */}

      <nav className="bottom-navigation">


        <button
          className="bottom-nav-item active"
        >

          <FiHome />

          <span>
            Home
          </span>

        </button>


        <button
          className="bottom-nav-item"
        >

          <FiSearch />

          <span>
            Search
          </span>

        </button>


        <button
          className="bottom-nav-item"
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


export default UserScreen;