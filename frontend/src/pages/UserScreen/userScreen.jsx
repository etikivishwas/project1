import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
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

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

const categories = [
  { id: 1, name: "Plumbing", icon: <FaWrench /> },
  { id: 2, name: "Electrical", icon: <FaBolt /> },
  { id: 3, name: "Cleaning", icon: <FaBroom /> },
  { id: 4, name: "Beauty", icon: <FaSpa /> },
  { id: 5, name: "Carpentry", icon: <FaPaintRoller /> },
  { id: 6, name: "Moving", icon: <FaTruckMoving /> },
  { id: 7, name: "HVAC", icon: <FaSnowflake /> },
  { id: 8, name: "More", icon: <FiMoreHorizontal /> },
];

const footerItems = [
  { label: "Home", path: "/userScreen", icon: FiHome },
  { label: "Search", path: "/vendorSearch", icon: FiSearch },
  { label: "History", path: "/userHistory", icon: FiClock },
];

const safeJson = async (response) => {
  const text = await response.text();
  if (!text) return {};

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

const VendorImage = ({ vendor, className }) => {
  const [failed, setFailed] = useState(false);
  const imageUrl = getImageUrl(vendor.imageUrl);
  const initial = String(vendor.name || "V").trim().charAt(0).toUpperCase() || "V";

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  if (!imageUrl || failed) {
    return (
      <div className={`${className} vendor-image-placeholder`} aria-label={`${vendor.name} image unavailable`}>
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={vendor.name}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

export default function UserScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/vendors`, {
        headers: { Accept: "application/json" },
      });
      const result = await safeJson(response);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch vendors.");
      }

      setVendors(Array.isArray(result.data) ? result.data : []);
    } catch (requestError) {
      console.error("Error fetching vendors:", requestError);
      setError(requestError.message || "Unable to load vendors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const normalizedVendors = useMemo(
    () =>
      vendors.map((vendor) => ({
        ...vendor,
        serviceType: vendor.serviceType ?? vendor.service_type ?? "Local services",
        isPremium: Boolean(vendor.isPremium ?? vendor.is_premium),
        isVerified: Boolean(vendor.isVerified ?? vendor.is_verified),
        imageUrl: vendor.imageUrl ?? vendor.image_url ?? null,
      })),
    [vendors]
  );

  const filteredVendors = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const selectedCategory = activeCategory?.name?.toLowerCase();

    return normalizedVendors.filter((vendor) => {
      const vendorText = [vendor.name, vendor.serviceType, vendor.city]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !normalizedSearch || vendorText.includes(normalizedSearch);
      const matchesCategory =
        !selectedCategory ||
        selectedCategory === "more" ||
        String(vendor.serviceType).toLowerCase().includes(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [normalizedVendors, search, activeCategory]);

  const featuredVendors = useMemo(
    () =>
      normalizedVendors
        .filter((vendor) => vendor.isPremium || vendor.isVerified)
        .sort(
          (firstVendor, secondVendor) =>
            Number(secondVendor.isPremium) - Number(firstVendor.isPremium) ||
            Number(secondVendor.rating || 0) - Number(firstVendor.rating || 0)
        )
        .slice(0, 4),
    [normalizedVendors]
  );

  const openVendor = (vendor) => {
    navigate(`/vendor/${vendor.id}`, { state: { vendorPreview: vendor } });
  };

  const handleCategoryClick = (category) => {
    if (category.name === "More") {
      navigate("/vendorSearch");
      return;
    }

    setActiveCategory((current) => (current?.id === category.id ? null : category));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const value = search.trim();

    if (value) {
      navigate(`/vendorSearch?search=${encodeURIComponent(value)}`);
    }
  };

  const contactVendor = (vendor) => {
    const whatsapp = String(vendor.whatsapp || "").replace(/\D/g, "");

    if (whatsapp) {
      const internationalNumber = whatsapp.length === 10 ? `91${whatsapp}` : whatsapp;
      window.open(`https://wa.me/${internationalNumber}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (vendor.phone) {
      window.location.href = `tel:${vendor.phone}`;
    }
  };

  const isFooterItemActive = (path) => {
    if (path === "/vendorSearch") return location.pathname.startsWith("/vendorSearch");
    if (path === "/userHistory") return location.pathname.startsWith("/userHistory");
    return location.pathname === path;
  };

  return (
    <>
      <div className="app-container">
        <header className="home-header">
          <button
            type="button"
            className="brand"
            onClick={() => navigate("/userScreen")}
            aria-label="Milieu Global home"
          >
            <span className="brand-logo">
              <img src={logo} alt="Milieu Global" />
            </span>
            <span className="brand-copy">
              <strong>Milieu Global</strong>
              <small>Trusted local services</small>
            </span>
          </button>

          <button
            type="button"
            className="profile-button"
            aria-label="Open profile"
            onClick={() => navigate("/userProfile")}
          >
            <FiUser />
          </button>
        </header>

        <main className="home-content">
          <section className="hero-section">
            <div className="hero-copy">
              <span className="hero-kicker">VERIFIED PROFESSIONALS</span>
              <h1>Find trusted help near you</h1>
              <p>Explore reliable local providers for your everyday needs.</p>
            </div>

            <form className="search-box" onSubmit={handleSearch}>
              <FiSearch className="search-icon" />
              <input
                type="search"
                name="search"
                placeholder="Search services or locations"
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="submit" className="search-submit" aria-label="Search">
                <FiArrowRight />
              </button>
            </form>
          </section>

          {!loading && featuredVendors.length > 0 && (
            <section className="section featured-section">
              <div className="section-header">
                <div>
                  <span className="section-eyebrow">HANDPICKED FOR YOU</span>
                  <h2>Premium Featured</h2>
                </div>
                <button
                  type="button"
                  className="view-all-button"
                  onClick={() => navigate("/vendorSearch?featured=true")}
                >
                  View all <FiChevronRight />
                </button>
              </div>

              <div className="featured-list">
                {featuredVendors.map((vendor, index) => (
                  <article
                    className="featured-card"
                    key={vendor.id}
                    style={{ "--card-index": index }}
                    role="link"
                    tabIndex={0}
                    onClick={() => openVendor(vendor)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openVendor(vendor);
                      }
                    }}
                  >
                    <VendorImage vendor={vendor} className="featured-image" />
                    <div className="featured-overlay" />
                    <div className="featured-content">
                      <div className="featured-badge">
                        <FiCheckCircle /> {vendor.isPremium ? "PREMIUM" : "VERIFIED"}
                      </div>
                      <h3>{vendor.name}</h3>
                      <p>{vendor.description || vendor.serviceType}</p>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openVendor(vendor);
                        }}
                      >
                        Explore provider <FiArrowRight />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="section categories-section">
            <div className="section-header compact">
              <div>
                <span className="section-eyebrow">WHAT DO YOU NEED?</span>
                <h2>Browse Categories</h2>
              </div>
            </div>

            <div className="category-grid">
              {categories.map((category, index) => (
                <button
                  type="button"
                  key={category.id}
                  className={`category-item ${activeCategory?.id === category.id ? "selected" : ""}`}
                  onClick={() => handleCategoryClick(category)}
                  style={{ "--category-index": index }}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="section vendors-section">
            <div className="section-header vendor-heading">
              <div>
                <span className="section-eyebrow">NEAR YOUR LOCATION</span>
                <h2>Top Verified Vendors</h2>
              </div>
              {!loading && !error && (
                <span className="result-count">{filteredVendors.length} found</span>
              )}
            </div>

            {activeCategory && (
              <div className="active-filter">
                <span>{activeCategory.name}</span>
                <button type="button" onClick={() => setActiveCategory(null)}>
                  Clear
                </button>
              </div>
            )}

            {loading && (
              <div className="vendor-list" aria-label="Loading vendors">
                {[1, 2, 3].map((item) => (
                  <div className="vendor-card vendor-skeleton" key={item}>
                    <div className="skeleton image" />
                    <div className="skeleton-lines">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="vendor-status error">
                <div className="status-icon"><FiRefreshCw /></div>
                <h3>Vendors could not be loaded</h3>
                <p>{error}</p>
                <button type="button" onClick={fetchVendors}>Try again</button>
              </div>
            )}

            {!loading && !error && filteredVendors.length === 0 && (
              <div className="vendor-status">
                <div className="status-icon"><FiSearch /></div>
                <h3>No matching vendors</h3>
                <p>Try another service, category, or location.</p>
              </div>
            )}

            {!loading && !error && filteredVendors.length > 0 && (
              <div className="vendor-list">
                {filteredVendors.map((vendor, index) => (
                  <article
                    className="vendor-card"
                    key={vendor.id}
                    style={{ "--vendor-index": index }}
                    role="link"
                    tabIndex={0}
                    onClick={() => openVendor(vendor)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openVendor(vendor);
                      }
                    }}
                  >
                    <div className="vendor-main">
                      <div className="vendor-image-wrap">
                        <VendorImage vendor={vendor} className="vendor-image" />
                        {vendor.isPremium && <span className="premium-chip">Premium</span>}
                      </div>

                      <div className="vendor-details">
                        <div className="vendor-title-row">
                          <h3>{vendor.name}</h3>
                          <div className="rating">
                            <FiStar />
                            <span>{Number(vendor.rating || 0).toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="vendor-service">{vendor.serviceType}</p>
                        <div className="vendor-meta">
                          {vendor.isVerified && (
                            <span className="verified"><FiCheckCircle /> Verified</span>
                          )}
                          <span className="distance"><FiMapPin /> {vendor.city || "Nearby"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="vendor-actions">
                      <button
                        type="button"
                        className="book-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openVendor(vendor);
                        }}
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        className="contact-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          contactVendor(vendor);
                        }}
                      >
                        <FiMessageSquare /> Contact
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <div className="bottom-navigation-viewport">
        <nav className="bottom-navigation" aria-label="Primary navigation">
          {footerItems.map(({ label, path, icon: Icon }) => {
            const active = isFooterItemActive(path);
            return (
              <button
                type="button"
                key={path}
                className={`bottom-nav-item ${active ? "active" : ""}`}
                onClick={() => location.pathname !== path && navigate(path)}
                aria-label={label}
                aria-current={active ? "page" : undefined}
              >
                <span className="bottom-nav-icon"><Icon /></span>
                <span className="bottom-nav-label">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
