import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiChevronDown,
  FiClock,
  FiHome,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiSliders,
  FiStar,
  FiX,
} from "react-icons/fi";
import logo from "../../assets/logo.jpeg";
import "./VendorSearch.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const fallbackVendorImage =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=500&q=80";

const quickSearches = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Beauty",
  "HVAC",
];

const footerItems = [
  { label: "Home", path: "/userScreen", icon: FiHome },
  { label: "Search", path: "/vendorSearch", icon: FiSearch },
  { label: "History", path: "/userHistory", icon: FiClock },
];

const getStartingPrice = (vendor) => {
  const price = vendor.starting_price ?? vendor.price;

  if (price === null || price === undefined || price === "") {
    return null;
  }

  const parsedPrice = Number(price);
  return Number.isFinite(parsedPrice) ? parsedPrice : null;
};

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function VendorSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get("search") || "";

  const [searchText, setSearchText] = useState(initialSearch);
  const [allVendors, setAllVendors] = useState([]);
  const [hasSearched, setHasSearched] = useState(Boolean(initialSearch));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState("default");
  const [distanceFilter, setDistanceFilter] = useState("default");
  const [ratingFilter, setRatingFilter] = useState("default");

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/vendors`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch vendors");
      }

      setAllVendors(Array.isArray(result.data) ? result.data : []);
    } catch (requestError) {
      console.error("Vendor fetch error:", requestError);
      setAllVendors([]);
      setError("Unable to load service providers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    if (!hasSearched || !searchText.trim()) {
      return [];
    }

    const query = searchText.trim().toLowerCase();

    const results = allVendors.filter((vendor) => {
      const searchableText = [
        vendor.name,
        vendor.service_type,
        vendor.description,
        vendor.address,
        vendor.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    return [...results].sort((a, b) => {
      if (priceFilter !== "default") {
        const firstPrice = getStartingPrice(a);
        const secondPrice = getStartingPrice(b);
        const priceA = firstPrice ?? (priceFilter === "low" ? Infinity : 0);
        const priceB = secondPrice ?? (priceFilter === "low" ? Infinity : 0);
        const priceDifference =
          priceFilter === "low" ? priceA - priceB : priceB - priceA;

        if (priceDifference !== 0) {
          return priceDifference;
        }
      }

      if (distanceFilter !== "default") {
        const distanceA = Number(a.distance ?? Infinity);
        const distanceB = Number(b.distance ?? Infinity);
        const distanceDifference =
          distanceFilter === "near"
            ? distanceA - distanceB
            : distanceB - distanceA;

        if (distanceDifference !== 0) {
          return distanceDifference;
        }
      }

      if (ratingFilter !== "default") {
        const ratingA = Number(a.rating || 0);
        const ratingB = Number(b.rating || 0);
        return ratingFilter === "high"
          ? ratingB - ratingA
          : ratingA - ratingB;
      }

      return Number(b.is_premium || 0) - Number(a.is_premium || 0);
    });
  }, [
    allVendors,
    searchText,
    hasSearched,
    priceFilter,
    distanceFilter,
    ratingFilter,
  ]);

  const activeFilterCount = [priceFilter, distanceFilter, ratingFilter].filter(
    (value) => value !== "default"
  ).length;

  const handleSearch = (value = searchText) => {
    const query = value.trim();

    if (!query) {
      setHasSearched(false);
      setSearchParams({});
      return;
    }

    setSearchText(query);
    setHasSearched(true);
    setSearchParams({ search: query });
  };

  const handleClearSearch = () => {
    setSearchText("");
    setHasSearched(false);
    setFiltersOpen(false);
    setPriceFilter("default");
    setDistanceFilter("default");
    setRatingFilter("default");
    setSearchParams({});
  };

  const handleCall = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleWhatsApp = (phone) => {
    if (!phone) {
      return;
    }

    const cleanNumber = String(phone).replace(/\D/g, "");
    const whatsappNumber =
      cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;

    window.open(
      `https://wa.me/${whatsappNumber}`,
      "_blank",
      "noopener,noreferrer"
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

  return (
    <>
      <div className="vendor-search-page">
        <header className="vendor-search-header">
          <button
            type="button"
            className="vendor-back-button"
            onClick={() => navigate("/userScreen")}
            aria-label="Go to home"
          >
            <FiArrowLeft />
          </button>

          <div className="vendor-search-brand">
            <img src={logo} alt="Milieu Global" />
            <div>
              <small>DISCOVER SERVICES</small>
              <strong>Search Providers</strong>
            </div>
          </div>

          <button
            type="button"
            className={`filter-icon-button ${filtersOpen ? "active" : ""}`}
            onClick={() => setFiltersOpen((current) => !current)}
            aria-label="Toggle filters"
            aria-expanded={filtersOpen}
          >
            <FiSliders />
            {activeFilterCount > 0 && (
              <span className="filter-count">{activeFilterCount}</span>
            )}
          </button>
        </header>

        <section className="search-hero">
          <div className="search-hero-copy">
            <span>TRUSTED LOCAL PROFESSIONALS</span>
            <h1>What service do you need?</h1>
            <p>Search by service, provider name, city, or locality.</p>
          </div>

          <form
            className="vendor-search-bar-wrapper"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <div className="vendor-search-input-container">
              <FiSearch className="search-input-icon" />
              <input
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Plumber, electrician, Hyderabad..."
                className="vendor-search-input"
                autoComplete="off"
              />

              {searchText && (
                <button
                  type="button"
                  className="clear-search-button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>

            <button type="submit" className="vendor-search-button">
              <FiSearch />
              <span>Search</span>
            </button>
          </form>

          {!hasSearched && (
            <div className="quick-search-row">
              {quickSearches.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => handleSearch(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={`filter-panel ${filtersOpen ? "open" : ""}`}>
          <div className="filter-panel-heading">
            <div>
              <small>SORT RESULTS</small>
              <h2>Refine your search</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setPriceFilter("default");
                setDistanceFilter("default");
                setRatingFilter("default");
              }}
            >
              Reset
            </button>
          </div>

          <div className="vendor-filter-row">
            <label className="filter-field">
              <span>Price</span>
              <div>
                <select
                  value={priceFilter}
                  onChange={(event) => setPriceFilter(event.target.value)}
                >
                  <option value="default">Any price</option>
                  <option value="low">Low to high</option>
                  <option value="high">High to low</option>
                </select>
                <FiChevronDown />
              </div>
            </label>

            <label className="filter-field">
              <span>Distance</span>
              <div>
                <select
                  value={distanceFilter}
                  onChange={(event) => setDistanceFilter(event.target.value)}
                >
                  <option value="default">Any distance</option>
                  <option value="near">Nearest first</option>
                  <option value="far">Farthest first</option>
                </select>
                <FiChevronDown />
              </div>
            </label>

            <label className="filter-field">
              <span>Rating</span>
              <div>
                <select
                  value={ratingFilter}
                  onChange={(event) => setRatingFilter(event.target.value)}
                >
                  <option value="default">Any rating</option>
                  <option value="high">Highest rated</option>
                  <option value="low">Lowest rated</option>
                </select>
                <FiChevronDown />
              </div>
            </label>
          </div>
        </section>

        <main className="vendor-search-content">
          {loading && (
            <div className="vendor-result-list" aria-label="Loading providers">
              {[1, 2, 3].map((item) => (
                <article className="vendor-result-card search-skeleton" key={item}>
                  <span className="skeleton-image" />
                  <span className="skeleton-copy">
                    <i />
                    <i />
                    <i />
                  </span>
                </article>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="search-status error">
              <span className="search-status-icon">
                <FiRefreshCw />
              </span>
              <h2>Providers could not be loaded</h2>
              <p>{error}</p>
              <button type="button" onClick={fetchVendors}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && !hasSearched && (
            <div className="search-empty-state">
              <span className="search-empty-icon">
                <FiSearch />
              </span>
              <h2>Find the right service provider</h2>
              <p>
                Enter a service or location above, or choose one of the popular
                searches.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            hasSearched &&
            filteredVendors.length === 0 && (
              <div className="search-status">
                <span className="search-status-icon">
                  <FiSearch />
                </span>
                <h2>No providers found</h2>
                <p>Try a broader service name or another location.</p>
                <button type="button" onClick={handleClearSearch}>
                  Clear search
                </button>
              </div>
            )}

          {!loading &&
            !error &&
            hasSearched &&
            filteredVendors.length > 0 && (
              <section className="vendor-results">
                <div className="results-header">
                  <div>
                    <small>SEARCH RESULTS</small>
                    <h2>
                      {filteredVendors.length}{" "}
                      {filteredVendors.length === 1 ? "provider" : "providers"}
                      {" "}found
                    </h2>
                  </div>
                  <span>“{searchText.trim()}”</span>
                </div>

                <div className="vendor-result-list">
                  {filteredVendors.map((vendor, index) => {
                    const startingPrice = getStartingPrice(vendor);

                    return (
                      <article
                        className={`vendor-result-card ${
                          vendor.is_premium ? "premium-card" : ""
                        }`}
                        key={vendor.id}
                        style={{ "--result-index": index }}
                      >
                        <div className="vendor-card-top">
                          <div className="vendor-image-wrap">
                            <img
                              src={vendor.image_url || fallbackVendorImage}
                              alt={vendor.name || "Service provider"}
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src = fallbackVendorImage;
                              }}
                            />
                            {vendor.is_premium ? (
                              <span className="premium-badge">Premium</span>
                            ) : null}
                          </div>

                          <div className="vendor-main-info">
                            <div className="vendor-name-row">
                              <h3>{vendor.name}</h3>
                              <span className="vendor-rating">
                                <FiStar />
                                {Number(vendor.rating || 0).toFixed(1)}
                              </span>
                            </div>

                            <p className="vendor-service-type">
                              {vendor.service_type || "General Service"}
                            </p>

                            <div className="vendor-meta">
                              {Boolean(vendor.is_verified) && (
                                <span className="verified-badge">Verified</span>
                              )}

                              <span className="vendor-location">
                                <FiMapPin />
                                {vendor.city || vendor.address || "Nearby"}
                              </span>
                            </div>

                            {startingPrice !== null && (
                              <p className="starting-price">
                                Starts from <strong>{formatPrice(startingPrice)}</strong>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="vendor-actions">
                          <button
                            type="button"
                            className="view-provider-button"
                            onClick={() => navigate(`/vendor/${vendor.id}`)}
                          >
                            View details
                          </button>

                          <button
                            type="button"
                            className="call-button"
                            onClick={() => handleCall(vendor.phone)}
                            disabled={!vendor.phone}
                          >
                            <FiPhone /> Call
                          </button>

                          <button
                            type="button"
                            className="whatsapp-button"
                            onClick={() =>
                              handleWhatsApp(vendor.whatsapp || vendor.phone)
                            }
                            disabled={!vendor.whatsapp && !vendor.phone}
                          >
                            <FiMessageSquare /> Chat
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
        </main>
      </div>

      <div className="search-bottom-viewport">
        <nav className="bottom-navigation" aria-label="Primary navigation">
          {footerItems.map(({ label, path, icon: Icon }) => {
            const active = isFooterActive(path);

            return (
              <button
                type="button"
                key={path}
                className={`bottom-nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (location.pathname !== path) {
                    navigate(path);
                  }
                }}
              >
                <span className="bottom-nav-icon">
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
