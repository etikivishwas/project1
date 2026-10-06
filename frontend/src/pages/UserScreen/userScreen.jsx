import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiHeart,
  FiHome,
  FiMapPin,
  FiMessageSquare,
  FiMoreHorizontal,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiUser,
} from "react-icons/fi";
import {
  FaBolt,
  FaBroom,
  FaPaintRoller,
  FaSnowflake,
  FaSpa,
  FaTruckMoving,
  FaWrench,
} from "react-icons/fa";
import logo from "../../assets/logo.jpeg";
import "./userScreen.css";
import {
  saveUserLocation,
  getUserLocation,
} from "../../api";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const categories = [
  { id: 1, name: "Plumbing", image: "/icons/plumbing.png" },
  { id: 2, name: "Electrical", image: "/icons/electrical.png" },
  { id: 3, name: "Cleaning", image: "/icons/cleaning.png" },
  { id: 4, name: "Beauty", image: "/icons/beauty.png" },
  { id: 5, name: "Carpentry", image: "/icons/carpentry.png" },
  { id: 6, name: "Moving", image: "/icons/moving.png" },
  { id: 7, name: "HVAC", image: "/icons/hvac.png" },
  { id: 8, name: "More", image: "/icons/more.png" },
];

const footerItems = [
  { label: "Home", path: "/userScreen", icon: FiHome },
  { label: "Search", path: "/vendorSearch", icon: FiSearch },
  { label: "History", path: "/userHistory", icon: FiClock },
];

const safeJson = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const getImageUrl = (imagePath) => {
  if (typeof imagePath !== "string" || !imagePath.trim()) {
    return null;
  }

  const normalizedPath = imagePath.trim();

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://") ||
    normalizedPath.startsWith("blob:") ||
    normalizedPath.startsWith("data:")
  ) {
    return normalizedPath;
  }

  return `${API_URL}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
};

const VendorImage = ({ vendor, className, eager = false }) => {
  const [failed, setFailed] = useState(false);
  const imageUrl = getImageUrl(vendor.imageUrl);
  const initial =
    String(vendor.name || "V").trim().charAt(0).toUpperCase() || "V";

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  if (!imageUrl || failed) {
    return (
      <div
        className={`${className} vendor-image-placeholder`}
        aria-label={`${vendor.name} image unavailable`}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <img
      key={imageUrl}
      src={imageUrl}
      alt={vendor.name}
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setFailed(false)}
      onError={() => {
        console.error("Vendor image failed:", {
          vendorId: vendor.id,
          vendorName: vendor.name,
          imageUrl,
        });

        setFailed(true);
      }}
    />
  );
};

export default function UserScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  // ---------------------------------------------------------
  // USER LOCATION
  // ---------------------------------------------------------

  const [userLocation, setUserLocation] = useState("Locating...");

  // Prevent duplicate GPS request during React development StrictMode.
  const locationRequestRef = useRef(false);

  // ---------------------------------------------------------
  // VENDORS / UI STATE
  // ---------------------------------------------------------

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchHistory, setSearchHistory] = useState([]);
const [searchHistoryLoading, setSearchHistoryLoading] = useState(false);
const [searchHistoryOpen, setSearchHistoryOpen] =
  useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [savedVendorIds, setSavedVendorIds] = useState(new Set());
  const vendorsSectionRef = useRef(null);
  const searchHeroRef = useRef(null);

  // ---------------------------------------------------------
  // FETCH VENDORS
  // ---------------------------------------------------------

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/vendors`, {
        headers: {
          Accept: "application/json",
        },
      });

      const result = await safeJson(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch vendors.");
      }

      setVendors(Array.isArray(result.data) ? result.data : []);
    } catch (requestError) {
      console.error("Error fetching vendors:", requestError);

      setError(
        requestError.message || "Unable to load vendors. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
// GET USER LOCATION
// ---------------------------------------------------------

useEffect(() => {
  // -------------------------------------------------------
  // 1. Check whether the user is logged in
  // -------------------------------------------------------

  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (!token) {
    console.log(
      "No authentication token. Skipping location."
    );

    setUserLocation("Location unavailable");
    return;
  }

  // -------------------------------------------------------
  // 2. Prevent duplicate requests in React StrictMode
  // -------------------------------------------------------

  if (locationRequestRef.current) {
    return;
  }

  locationRequestRef.current = true;

  // -------------------------------------------------------
  // 3. Check browser GPS support
  // -------------------------------------------------------

  if (!navigator.geolocation) {
    console.log(
      "Geolocation is not supported by this browser."
    );

    setUserLocation("Location unavailable");
    return;
  }

  // -------------------------------------------------------
  // 4. Load previously saved location first
  // -------------------------------------------------------

  const loadLocation = async () => {
    try {
      const savedResponse =
        await getUserLocation();

      const savedLocation =
        savedResponse?.data?.data || null;

      const savedName =
        savedLocation?.location_name ||
        savedLocation?.city ||
        savedLocation?.address ||
        null;

      if (savedName) {
        setUserLocation(savedName);
      }

    } catch (error) {
      // 404 simply means the user has no saved
      // location yet.

      if (error?.response?.status !== 404) {
        console.error(
          "Could not load saved location:",
          error
        );
      }
    }

    // -----------------------------------------------------
    // 5. Get current GPS location
    // -----------------------------------------------------

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const {
          latitude,
          longitude,
        } = position.coords;

        console.log(
          "GPS:",
          latitude,
          longitude
        );

        try {
          // -----------------------------------------------
          // Send GPS to backend
          //
          // Backend decides whether it actually needs
          // to reverse-geocode or simply return the
          // existing saved location.
          // -----------------------------------------------

          const response =
            await saveUserLocation(
              latitude,
              longitude
            );

          console.log(
            "Location response:",
            response.data
          );

          const savedLocation =
            response?.data?.data || null;

          const locationName =
            savedLocation?.location_name ||
            savedLocation?.locality ||
            savedLocation?.suburb ||
            savedLocation?.neighbourhood ||
            savedLocation?.city ||
            null;

          if (locationName) {
            setUserLocation(
              locationName
            );
          }

        } catch (error) {
          console.error(
            "Location save failed:",
            error.response?.data ||
              error.message
          );

          // Don't destroy an already displayed
          // saved location if the new GPS request fails.
        }
      },

      (error) => {
        console.error(
          "GPS error:",
          error.code,
          error.message
        );

        // If we already loaded a saved location,
        // don't replace it with "Location unavailable".
      },

      {
        enableHighAccuracy: true,

        timeout: 15000,

        // Browser can reuse a GPS result up to
        // 5 minutes old.
        maximumAge: 5 * 60 * 1000,
      }
    );
  };

  loadLocation();

}, []);

// ---------------------------------------------------------
// FETCH RECENT SEARCHES
// ---------------------------------------------------------

useEffect(() => {
  const fetchSearchHistory = async () => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      setSearchHistoryLoading(true);

      const response = await fetch(
        `${API_URL}/api/search-history`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await safeJson(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to fetch search history."
        );
      }

      setSearchHistory(
        Array.isArray(result.data)
          ? result.data.slice(0, 3)
          : []
      );
    } catch (error) {
      console.error(
        "Error fetching search history:",
        error
      );
    } finally {
      setSearchHistoryLoading(false);
    }
  };

  fetchSearchHistory();
}, []);

useEffect(() => {
  const handleOutsideClick = (event) => {
    if (
      searchHeroRef.current &&
      !searchHeroRef.current.contains(event.target)
    ) {
      setSearchHistoryOpen(false);
    }
  };

  document.addEventListener(
    "mousedown",
    handleOutsideClick
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleOutsideClick
    );
  };
}, []);


  // ---------------------------------------------------------
  // FETCH VENDORS ON PAGE LOAD
  // ---------------------------------------------------------

  useEffect(() => {
    fetchVendors();
  }, []);
//fetch saved providers 

useEffect(() => {
  const fetchSavedProviders = async () => {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/user/saved-providers`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await safeJson(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to fetch saved providers."
        );
      }

      const savedIds = new Set(
        (Array.isArray(result.data) ? result.data : []).map(
          (vendor) => Number(vendor.id)
        )
      );

      setSavedVendorIds(savedIds);
    } catch (error) {
      console.error(
        "Error fetching saved providers:",
        error
      );
    }
  };

  fetchSavedProviders();
}, []);
  // ---------------------------------------------------------
  // NORMALIZE VENDORS
  // ---------------------------------------------------------

  const normalizedVendors = useMemo(
    () =>
      vendors.map((vendor) => ({
        ...vendor,

        serviceType:
          vendor.serviceType ??
          vendor.service_type ??
          "Local services",

        isPremium: Boolean(
          vendor.isPremium ?? vendor.is_premium
        ),

        isVerified: Boolean(
          vendor.isVerified ?? vendor.is_verified
        ),

        imageUrl:
          vendor.imageUrl ??
          vendor.image_url ??
          (vendor.id
            ? `/api/images/vendors/${vendor.id}/main`
            : null),
      })),
    [vendors]
  );

  // ---------------------------------------------------------
  // FILTER VENDORS
  // ---------------------------------------------------------

  const filteredVendors = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const selectedCategory =
      activeCategory?.name?.toLowerCase();

    return normalizedVendors.filter((vendor) => {
      const vendorText = [
        vendor.name,
        vendor.serviceType,
        vendor.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        vendorText.includes(normalizedSearch);

      const matchesCategory =
        !selectedCategory ||
        selectedCategory === "more" ||
        String(vendor.serviceType || "")
          .toLowerCase()
          .includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [
    normalizedVendors,
    search,
    activeCategory,
  ]);

  // ---------------------------------------------------------
  // FEATURED VENDORS
  // ---------------------------------------------------------

  const featuredVendors = useMemo(
    () =>
      normalizedVendors
        .filter(
          (vendor) =>
            vendor.isPremium || vendor.isVerified
        )
        .sort(
          (firstVendor, secondVendor) =>
            Number(secondVendor.isPremium) -
              Number(firstVendor.isPremium) ||
            Number(secondVendor.rating || 0) -
              Number(firstVendor.rating || 0)
        )
        .slice(0, 4),
    [normalizedVendors]
  );

  // ---------------------------------------------------------
  // VISIBLE VENDORS
  // ---------------------------------------------------------

  const visibleVendors = useMemo(() => {
  return [...filteredVendors].sort(
    (a, b) =>
      Number(b.isVerified) - Number(a.isVerified) ||
      Number(b.rating || 0) - Number(a.rating || 0)
  );
}, [filteredVendors]);

  // ---------------------------------------------------------
  // PROMO VENDOR
  // ---------------------------------------------------------

  const promoVendor =
    normalizedVendors.find((vendor) =>
      String(vendor.serviceType || "")
        .toLowerCase()
        .includes("clean")
    ) ||
    featuredVendors[0] ||
    normalizedVendors[0] ||
    null;

    const toggleSavedProvider = async (vendor) => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (!token) {
    navigate("/login");
    return;
  }

  const vendorId = Number(vendor.id);
  const isSaved = savedVendorIds.has(vendorId);

  try {
    const response = await fetch(
      `${API_URL}/api/user/saved-providers/${vendorId}`,
      {
        method: isSaved ? "DELETE" : "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await safeJson(response);

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to update saved provider."
      );
    }

    setSavedVendorIds((current) => {
      const updated = new Set(current);

      if (isSaved) {
        updated.delete(vendorId);
      } else {
        updated.add(vendorId);
      }

      return updated;
    });
  } catch (error) {
    console.error(
      "Save provider error:",
      error
    );
  }
};

  // ---------------------------------------------------------
  // OPEN VENDOR
  // ---------------------------------------------------------

  const openVendor = (vendor) => {
    navigate(`/vendor/${vendor.id}`, {
      state: {
        vendorPreview: vendor,
      },
    });
  };

  // ---------------------------------------------------------
  // CATEGORY CLICK
  // ---------------------------------------------------------

  const handleCategoryClick = (category) => {
    if (category.name === "More") {
      navigate("/moreCategories");
      return;
    }

    const isSameCategory =
      activeCategory?.id === category.id;

    setActiveCategory((current) =>
      current?.id === category.id
        ? null
        : category
    );

    // Let React update the filter first,
    // then move to the vendor section.
    requestAnimationFrame(() => {
      vendorsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
// ---------------------------------------------------------
// RECENT SEARCH
// ---------------------------------------------------------

const handleRecentSearch = (query) => {
  const value = String(query || "").trim();

  if (!value) {
    return;
  }

  setSearchHistoryOpen(false);

  navigate(
    `/vendorSearch?search=${encodeURIComponent(value)}`
  );
};

const clearSearchHistory = async () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    setSearchHistory([]);
    setSearchHistoryOpen(false);
    return;
  }

  const previous = searchHistory;
  setSearchHistory([]);
  setSearchHistoryOpen(false);

  try {
    const response = await fetch(`${API_URL}/api/search-history`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // 204 has no body, so don't rely on result.success
    if (!response.ok) {
      const result = await safeJson(response);
      throw new Error(result.message || `Clear failed (${response.status})`);
    }
  } catch (error) {
    console.error("Clear search history error:", error);
    setSearchHistory(previous); // roll back so the UI matches the server
  }
};
  // ---------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------

 const handleSearch = (event) => {
  event.preventDefault();

  const value = search.trim();

  if (!value) {
    return;
  }

  setSearchHistoryOpen(false);

  navigate(
    `/vendorSearch?search=${encodeURIComponent(value)}`
  );
};

  // ---------------------------------------------------------
  // CONTACT VENDOR
  // ---------------------------------------------------------

  const contactVendor = (vendor) => {
    const normalizedNumber = String(
      vendor.whatsapp ||
        vendor.phone ||
        ""
    ).replace(/\D/g, "");

    if (normalizedNumber) {
      const internationalNumber =
        normalizedNumber.length === 10
          ? `91${normalizedNumber}`
          : normalizedNumber;

      window.open(
        `https://wa.me/${internationalNumber}`,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    if (vendor.phone) {
      window.location.href = `tel:${vendor.phone}`;
    }
  };

  // ---------------------------------------------------------
  // FOOTER ACTIVE STATE
  // ---------------------------------------------------------

  const isFooterItemActive = (path) => {
    if (path === "/vendorSearch") {
      return location.pathname.startsWith(
        "/vendorSearch"
      );
    }

    if (path === "/userHistory") {
      return location.pathname.startsWith(
        "/userHistory"
      );
    }

    return location.pathname === path;
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <>
      <div className="app-container">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="home-header">

          <button
            className="brand"
            type="button"
          >
            <span className="brand-logo">
              <img
                src={logo}
                alt="Tezo Bizz"
              />
            </span>

            <span className="brand-content">

              <span className="brand-copy">
                <strong>TEDO BIZZ</strong>
                
              </span>

              <span className="header-location">
                <FiMapPin
                  className="header-location-icon"
                />

                <strong>
                  {userLocation}
                </strong>
              </span>

            </span>
          </button>

          <button
            className="profile-button"
            type="button"
            onClick={() =>
              navigate("/userProfile")
            }
          >
            <FiUser />
          </button>

        </header>

        {/* ===================================================
            MAIN CONTENT
        =================================================== */}

        <main className="home-content">

          {/* SEARCH */}
<section
  ref={searchHeroRef}
  className="search-hero"
>

  <form
    className="search-box"
    onSubmit={handleSearch}
  >
    <FiSearch className="search-icon" />

   <input
  type="search"
  name="search"
  placeholder="Search for services, providers, or locations..."
  autoComplete="off"
  value={search}
  onChange={(event) =>
    setSearch(event.target.value)
  }
  onFocus={() =>
    setSearchHistoryOpen(true)
  }
/>
  </form>

  {/* RECENT SEARCHES */}
  {searchHistoryOpen &&
  !searchHistoryLoading &&
  searchHistory.length > 0 && (
      <div
      className="recent-searches"
      onMouseDown={(event) => event.preventDefault()}
    >

        <div className="recent-searches-header">
          <span>
            Recent
          </span>

          <button
  type="button"
  onPointerDown={() => console.log("pointerdown on Clear")}
  onClick={() => {
    console.log("click on Clear");
    clearSearchHistory();
  }}
>
  Clear
</button>
        </div>

        <div className="recent-search-list">

          {searchHistory.map((item) => (
            <button
              type="button"
              key={item.id}
              className="recent-search-item"
              onClick={() =>
                handleRecentSearch(
                  item.searchQuery
                )
              }
            >
              <FiClock />

              <span>
                {item.searchQuery}
              </span>

              <FiChevronRight />
            </button>
          ))}

        </div>

      </div>
    )}

</section>
          {/* =================================================
              FEATURED VENDORS
          ================================================= */}

          {!loading &&
            featuredVendors.length > 0 && (
              <section
                className="home-section featured-section"
              >

                <div className="section-header">

                  <h2>
                    Premium Featured
                  </h2>

                  <button
                    type="button"
                    className="view-all-button"
                    onClick={() =>
                      navigate(
                        "/vendorSearch?featured=true"
                      )
                    }
                  >
                    View All
                    <FiChevronRight />
                  </button>

                </div>

                <div className="featured-list">

                  {featuredVendors.map(
                    (vendor) => (
                      <article
                        className="featured-card"
                        key={vendor.id}
                        role="link"
                        tabIndex={0}
                        onClick={() =>
                          openVendor(vendor)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            openVendor(vendor);
                          }
                        }}
                      >

                        <VendorImage
                          vendor={vendor}
                          className="featured-image"
                          eager
                        />

                        <div className="featured-overlay" />

                        <div className="featured-content">

                          <span className="featured-badge">
                            <FiCheckCircle />

                            {vendor.isPremium
                              ? "TOP RATED"
                              : "VERIFIED"}
                          </span>

                          <h3>
                            {vendor.name}
                          </h3>

                          <p>
                            {vendor.serviceType}
                          </p>

                        </div>

                      </article>
                    )
                  )}

                </div>

              </section>
            )}

          {/* =================================================
              CATEGORIES
          ================================================= */}

          <section className="category-section">

            <div className="category-grid">

              {categories.map(
                (category) => (
                  <button
                    type="button"
                    key={category.id}
                    className={`category-item ${
                      activeCategory?.id ===
                      category.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleCategoryClick(
                        category
                      )
                    }
                  >

                    <span className="category-icon">
                      <img
                        src={category.image}
                        alt=""
                      />
                    </span>

                    <span className="category-label">
                      {category.name}
                    </span>

                  </button>
                )
              )}

            </div>

          </section>

          {/* =================================================
              PROMO
          ================================================= */}

          {promoVendor && (
            <section className="promo-section">

              <button
                type="button"
                className="promo-card"
                onClick={() =>
                  openVendor(promoVendor)
                }
              >

                <VendorImage
                  vendor={promoVendor}
                  className="promo-image"
                  eager
                />

                <span className="promo-overlay" />

                <span className="promo-copy">

                  <small>
                    50% OFF
                  </small>

                  <strong>
                    FIRST CLEAN
                  </strong>

                  <span>
                    Reliable and professional
                    home services.
                  </span>

                  <b>
                    BOOK NOW
                  </b>

                </span>

              </button>

            </section>
          )}

          {/* =================================================
              VENDORS
          ================================================= */}

          <section
            ref={vendorsSectionRef}
            className="home-section vendors-section"
          >

            <div className="vendor-heading">

              <h2>
              Vendors Near You
              </h2>

            </div>

            {/* ACTIVE CATEGORY */}
            {activeCategory && (
              <div className="active-filter">

                <span>
                  {activeCategory.name}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setActiveCategory(null)
                  }
                >
                  Clear
                </button>

              </div>
            )}

            {/* LOADING */}
            {loading && (
              <div
                className="vendor-grid"
                aria-label="Loading vendors"
              >

                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      className="vendor-card vendor-skeleton"
                      key={item}
                    >

                      <div className="skeleton skeleton-image" />

                      <div className="skeleton skeleton-line" />

                      <div className="skeleton skeleton-line short" />

                    </div>
                  )
                )}

              </div>
            )}

            {/* ERROR */}
            {!loading && error && (
              <div className="vendor-status error">

                <div className="status-icon">
                  <FiRefreshCw />
                </div>

                <h3>
                  Vendors could not be loaded
                </h3>

                <p>
                  {error}
                </p>

                <button
                  type="button"
                  onClick={fetchVendors}
                >
                  Try again
                </button>

              </div>
            )}

            {/* NO VENDORS */}
            {!loading &&
              !error &&
              visibleVendors.length === 0 && (
                <div className="vendor-status">

                  <div className="status-icon">
                    <FiSearch />
                  </div>

                  <h3>
                    No matching vendors
                  </h3>

                  <p>
                    Try another service,
                    category, or location.
                  </p>

                </div>
              )}

            {/* VENDOR LIST */}
            {!loading &&
              !error &&
              visibleVendors.length > 0 && (
                <div className="vendor-grid">

                  {visibleVendors.map(
                    (vendor) => (
                      <article
                        className="vendor-card"
                        key={vendor.id}
                        role="link"
                        tabIndex={0}
                        onClick={() =>
                          openVendor(vendor)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            openVendor(vendor);
                          }
                        }}
                      >

                        <VendorImage
                          vendor={vendor}
                          className="vendor-image"
                        />

                        <button
  type="button"
  className={`save-provider-button ${
    savedVendorIds.has(Number(vendor.id))
      ? "saved"
      : ""
  }`}
  onClick={(event) => {
    event.stopPropagation();
    toggleSavedProvider(vendor);
  }}
  aria-label={
    savedVendorIds.has(Number(vendor.id))
      ? "Remove from saved providers"
      : "Save provider"
  }
>
  <FiHeart
    fill={
      savedVendorIds.has(Number(vendor.id))
        ? "currentColor"
        : "none"
    }
  />
</button>

                        <div className="vendor-name-row">

                          <h3>
                            {vendor.name}
                          </h3>

                          <span className="rating">
                            <FiStar />

                            {Number(
                              vendor.rating || 0
                            ).toFixed(1)}
                          </span>

                        </div>

                        {/* VERIFIED */}
                        {vendor.isVerified && (
                          <span className="verified-label">
                            <FiCheckCircle />
                            TEDO VERIFIED
                          </span>
                        )}

                        {/* LOCATION */}
                        {!vendor.isVerified && (
                          <span className="vendor-location">
                            <FiMapPin />
                            {vendor.city ||
                              "Nearby"}
                          </span>
                        )}

                        {/* ACTIONS */}
                        <div className="vendor-actions">

                          <button
                            type="button"
                            className="contact-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              contactVendor(
                                vendor
                              );
                            }}
                          >
                            <FiMessageSquare />
                            Contact
                          </button>

                          <button
                            type="button"
                            className="book-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openVendor(
                                vendor
                              );
                            }}
                          >
                            Book
                          </button>

                        </div>

                      </article>
                    )
                  )}

                </div>
              )}

          </section>

        </main>

      </div>

      {/* =====================================================
          BOTTOM NAVIGATION
      ===================================================== */}

      <div className="bottom-navigation-viewport">

        <nav
          className="bottom-navigation"
          aria-label="Primary navigation"
        >

          {footerItems.map(
            ({
              label,
              path,
              icon: Icon,
            }) => {

              const active =
                isFooterItemActive(path);

              return (
                <button
                  type="button"
                  key={path}
                  className={`bottom-nav-item ${
                    active ? "active" : ""
                  }`}
                  onClick={() =>
                    location.pathname !==
                      path &&
                    navigate(path)
                  }
                  aria-label={label}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                >

                  <span className="bottom-nav-icon">
                    <Icon />
                  </span>

                  <span className="bottom-nav-label">
                    {label}
                  </span>

                </button>
              );
            }
          )}

        </nav>

      </div>
    </>
  );
}