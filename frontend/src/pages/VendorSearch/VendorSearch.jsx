import React, { useEffect, useMemo, useRef,useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiChevronDown,
  FiClock,
  FiHome,
  FiInfo,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiSliders,
  FiStar,
  FiX,
} from "react-icons/fi";
import logo from "../../assets/logo.jpeg";
import "./VendorSearch.css";
import { FaWhatsapp } from "react-icons/fa";

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

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export default function VendorSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const lastSavedSearchRef = useRef("");
  const initialSearch = searchParams.get("search") || "";
  const isFeatured = searchParams.get("featured") === "true";

  const [searchText, setSearchText] = useState(initialSearch);
  const [allVendors, setAllVendors] = useState([]);
  const [hasSearched, setHasSearched] = useState(Boolean(initialSearch));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceFilter, setPriceFilter] = useState("default");
  const [distanceFilter, setDistanceFilter] = useState("default");
  const [ratingFilter, setRatingFilter] = useState("default");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  const fetchSearchHistory = async () => {
    try {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token) {
        setSearchHistory([]);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/search-history`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setSearchHistory(
          Array.isArray(result.data) ? result.data : []
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch search history:",
        error
      );
    }
  };

  const saveSearchHistory = async (query) => {
    try {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token || !query) {
        return;
      }

      const response = await fetch(
        `${API_URL}/api/search-history`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            searchQuery: query,
          }),
        }
      );

      if (response.ok) {
        fetchSearchHistory();
      }
    } catch (error) {
      console.error(
        "Failed to save search history:",
        error
      );
    }
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/vendors`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to fetch vendors"
        );
      }

      setAllVendors(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (requestError) {
      console.error(
        "Vendor fetch error:",
        requestError
      );
      setAllVendors([]);
      setError(
        "Unable to load service providers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");

        if (!token) return;

        const response = await fetch(
          `${API_URL}/api/user/location`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (
          response.ok &&
          result.success &&
          result.data
        ) {
          setUserLocation({
            latitude: Number(result.data.latitude),
            longitude: Number(result.data.longitude),
          });
        }
      } catch (error) {
        console.error(
          "User location fetch error:",
          error
        );
      }
    };

    fetchUserLocation();
  }, []);

  /*
   * Save searches whenever the URL search parameter changes.
   * This handles:
   * - manual searches
   * - quick searches
   * - recent searches
   * - category searches
   * - subcategory searches
   */
  useEffect(() => {
  const query =
    searchParams.get("search")?.trim() || "";

  if (!query || isFeatured) {
    return;
  }

  const normalizedQuery = query.toLowerCase();

  if (lastSavedSearchRef.current === normalizedQuery) {
    return;
  }

  lastSavedSearchRef.current = normalizedQuery;

  saveSearchHistory(query);
}, [searchParams, isFeatured]);

  const filteredVendors = useMemo(() => {
    if (isFeatured) {
      const premiumVendors = allVendors.filter(
        (vendor) =>
          Number(vendor.is_premium || 0) === 1
      );

      return [...premiumVendors].sort(
        (a, b) =>
          Number(b.is_verified || 0) -
            Number(a.is_verified || 0) ||
          Number(b.rating || 0) -
            Number(a.rating || 0)
      );
    }

    if (!hasSearched || !searchText.trim()) {
      return [];
    }

    const queryWords = searchText
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const results = allVendors.filter((vendor) => {
      const subcategoryText = Array.isArray(
        vendor.subcategories
      )
        ? vendor.subcategories.join(" ")
        : vendor.subcategories || "";

      const searchableText = [
        vendor.name,
        vendor.service_type,
        vendor.description,
        vendor.address,
        vendor.city,
        vendor.state,
        subcategoryText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return queryWords.every((word) =>
        searchableText.includes(word)
      );
    });

    const vendorsWithDistance = results.map(
      (vendor) => {
        if (
          !userLocation ||
          vendor.latitude === null ||
          vendor.longitude === null
        ) {
          return {
            ...vendor,
            distance: null,
          };
        }

        return {
          ...vendor,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            Number(vendor.latitude),
            Number(vendor.longitude)
          ),
        };
      }
    );

    return [...vendorsWithDistance].sort((a, b) => {
      if (priceFilter !== "default") {
        const firstPrice = getStartingPrice(a);
        const secondPrice = getStartingPrice(b);

        const priceA =
          firstPrice ??
          (priceFilter === "low" ? Infinity : 0);

        const priceB =
          secondPrice ??
          (priceFilter === "low" ? Infinity : 0);

        const priceDifference =
          priceFilter === "low"
            ? priceA - priceB
            : priceB - priceA;

        if (priceDifference !== 0) {
          return priceDifference;
        }
      }

      if (distanceFilter !== "default") {
        const distanceA = a.distance ?? Infinity;
        const distanceB = b.distance ?? Infinity;

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

      if (distanceFilter === "default") {
        const distanceA = a.distance ?? Infinity;
        const distanceB = b.distance ?? Infinity;

        if (distanceA !== distanceB) {
          return distanceA - distanceB;
        }
      }

      return (
        Number(b.is_premium || 0) -
        Number(a.is_premium || 0)
      );
    });
  }, [
    allVendors,
    searchText,
    hasSearched,
    priceFilter,
    distanceFilter,
    ratingFilter,
    userLocation,
    isFeatured,
  ]);

  const activeFilterCount = [
    priceFilter,
    distanceFilter,
    ratingFilter,
  ].filter((value) => value !== "default").length;

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

  const clearSearchHistory = async () => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (!token) {
    setSearchHistory([]);
    return;
  }

  // Clear UI immediately
  setSearchHistory([]);

  try {
    const response = await fetch(
      `${API_URL}/api/search-history`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

        if (!response.ok) {
      throw new Error("Failed to clear search history.");
    }
  } catch (error) {
    console.error(
      "Clear search history error:",
      error
    );
  }
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

    const cleanNumber = String(phone).replace(
      /\D/g,
      ""
    );

    const whatsappNumber =
      cleanNumber.length === 10
        ? `91${cleanNumber}`
        : cleanNumber;

    window.open(
      `https://wa.me/${whatsappNumber}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const isFooterActive = (path) => {
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
        </header>

        <section className="search-hero">
          <div className="search-hero-copy">
            <span>TRUSTED LOCAL PROFESSIONALS</span>

            <h1>What service do you need?</h1>

            <p>
              Search by service, provider name, city,
              or locality.
            </p>
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
                type="text"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
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

            <button
              type="button"
              className={`filter-icon-button ${
                filtersOpen ? "active" : ""
              }`}
              onClick={() =>
                setFiltersOpen((current) => !current)
              }
              aria-label="Toggle filters"
              aria-expanded={filtersOpen}
            >
              <FiSliders />

              <span>Filter</span>

              {activeFilterCount > 0 && (
                <span className="filter-count">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </form>

          {!hasSearched &&
            !isFeatured &&
            searchHistory.length > 0 && (
              <div className="search-history-panel">
                <div className="search-history-header">
                  <div>
                    <small>RECENT</small>
                    <strong>Recent searches</strong>
                  </div>

                  <button
                    type="button"
                    onClick={clearSearchHistory}
                  >
                    Clear
                  </button>
                </div>

                <div className="search-history-list">
                  {searchHistory.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className="search-history-item"
                      onClick={() =>
                        handleSearch(
                          item.searchQuery
                        )
                      }
                    >
                      <span className="search-history-icon">
                        <FiClock />
                      </span>

                      <span className="search-history-text">
                        {item.searchQuery}
                      </span>

                      <FiArrowLeft className="search-history-arrow" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          {!hasSearched && !isFeatured && (
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

        <section
          className={`filter-panel ${
            filtersOpen ? "open" : ""
          }`}
        >
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
                  onChange={(event) =>
                    setPriceFilter(event.target.value)
                  }
                >
                  <option value="default">
                    Any price
                  </option>
                  <option value="low">
                    Low to high
                  </option>
                  <option value="high">
                    High to low
                  </option>
                </select>

                <FiChevronDown />
              </div>
            </label>

            <label className="filter-field">
              <span>Distance</span>

              <div>
                <select
                  value={distanceFilter}
                  onChange={(event) =>
                    setDistanceFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="default">
                    Any distance
                  </option>
                  <option value="near">
                    Nearest first
                  </option>
                  <option value="far">
                    Farthest first
                  </option>
                </select>

                <FiChevronDown />
              </div>
            </label>

            <label className="filter-field">
              <span>Rating</span>

              <div>
                <select
                  value={ratingFilter}
                  onChange={(event) =>
                    setRatingFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="default">
                    Any rating
                  </option>
                  <option value="high">
                    Highest rated
                  </option>
                  <option value="low">
                    Lowest rated
                  </option>
                </select>

                <FiChevronDown />
              </div>
            </label>
          </div>
        </section>

        <main className="vendor-search-content">
          {loading && (
            <div
              className="vendor-result-list"
              aria-label="Loading providers"
            >
              {[1, 2, 3].map((item) => (
                <article
                  className="vendor-result-card search-skeleton"
                  key={item}
                >
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

              <button
                type="button"
                onClick={fetchVendors}
              >
                Try again
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            !hasSearched &&
            !isFeatured && (
              <div className="search-empty-state">
                <span className="search-empty-icon">
                  <FiSearch />
                </span>

                <h2>
                  Find the right service provider
                </h2>

                <p>
                  Enter a service or location above, or
                  choose one of the popular searches.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            (isFeatured || hasSearched) &&
            filteredVendors.length === 0 && (
              <div className="search-status">
                <span className="search-status-icon">
                  <FiSearch />
                </span>

                <h2>
                  {isFeatured
                    ? "No premium providers found"
                    : "No providers found"}
                </h2>

                <p>
                  {isFeatured
                    ? "There are currently no premium providers available."
                    : "Try a broader service name or another location."}
                </p>

                <button
                  type="button"
                  onClick={handleClearSearch}
                >
                  Clear search
                </button>
              </div>
            )}

          {!loading &&
            !error &&
            (isFeatured || hasSearched) &&
            filteredVendors.length > 0 && (
              <section className="vendor-results">
                <div className="results-header">
                  <div>
                    <small>
                      {isFeatured
                        ? "FEATURED PROVIDERS"
                        : "SEARCH RESULTS"}
                    </small>

                    <h2>
                      {filteredVendors.length}{" "}
                      {filteredVendors.length === 1
                        ? "provider"
                        : "providers"}
                      {isFeatured
                        ? " featured"
                        : " found"}
                    </h2>
                  </div>

                  <span>
                    {isFeatured
                      ? "Premium providers"
                      : `“${searchText.trim()}”`}
                  </span>
                </div>

                <div className="vendor-result-list">
                  {filteredVendors.map(
                    (vendor, index) => {
                      const startingPrice =
                        getStartingPrice(vendor);

                      return (
                        <article
                          className={`vendor-result-card ${
                            vendor.is_premium
                              ? "premium-card"
                              : ""
                          }`}
                          key={vendor.id}
                          style={{
                            "--result-index": index,
                          }}
                        >
                          <div className="vendor-card-top">
                            <div className="vendor-image-wrap">
                              <img
                                src={
                                  vendor.image_url ||
                                  fallbackVendorImage
                                }
                                alt={
                                  vendor.name ||
                                  "Service provider"
                                }
                                onError={(event) => {
                                  event.currentTarget.onerror =
                                    null;

                                  event.currentTarget.src =
                                    fallbackVendorImage;
                                }}
                              />

                              {vendor.is_premium ? (
                                <span className="premium-badge">
                                  Premium
                                </span>
                              ) : null}
                            </div>

                            <div className="vendor-main-info">
                              <div className="vendor-name-row">
                                <div className="vendor-name-with-info">
                                  <h3>{vendor.name}</h3>

                                  <button
                                    type="button"
                                    className="vendor-info-button"
                                    onClick={() =>
                                      setSelectedVendor(
                                        vendor
                                      )
                                    }
                                    aria-label={`View details for ${vendor.name}`}
                                  >
                                    <FiInfo />
                                  </button>
                                </div>

                                <span className="vendor-rating">
                                  <FiStar />

                                  {Number(
                                    vendor.rating || 0
                                  ).toFixed(1)}
                                </span>
                              </div>

                              <p className="vendor-service-type">
                                {vendor.service_type ||
                                  "General Service"}
                              </p>

                              <div className="vendor-meta">
                                {Boolean(
                                  vendor.is_verified
                                ) && (
                                  <span className="verified-badge">
                                    Verified
                                  </span>
                                )}

                                <span className="vendor-location">
                                  <FiMapPin />

                                  {vendor.city ||
                                    vendor.address ||
                                    "Nearby"}
                                </span>

                                {typeof vendor.distance ===
                                  "number" && (
                                  <span className="vendor-distance">
                                    {vendor.distance.toFixed(
                                      1
                                    )}{" "}
                                    km away
                                  </span>
                                )}
                              </div>

                              {startingPrice !== null && (
                                <p className="starting-price">
                                  Starts from{" "}
                                  <strong>
                                    {formatPrice(
                                      startingPrice
                                    )}
                                  </strong>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="vendor-actions">
                            <button
                              type="button"
                              className="view-provider-button"
                              onClick={() =>
                                navigate(
                                  `/vendor/${vendor.id}`
                                )
                              }
                            >
                              View details
                            </button>

                            <a
                              className={`call-button ${
                                !vendor.phone
                                  ? "disabled"
                                  : ""
                              }`}
                              href={
                                vendor.phone
                                  ? `tel:${String(
                                      vendor.phone
                                    ).trim()}`
                                  : undefined
                              }
                              aria-disabled={
                                !vendor.phone
                              }
                              onClick={(event) => {
                                if (!vendor.phone) {
                                  event.preventDefault();
                                }
                              }}
                            >
                              <FiPhone /> Call
                            </a>

                            <button
                              type="button"
                              className="whatsapp-button"
                              onClick={() =>
                                handleWhatsApp(
                                  vendor.whatsapp ||
                                    vendor.phone
                                )
                              }
                              disabled={
                                !vendor.whatsapp &&
                                !vendor.phone
                              }
                            >
                              <FaWhatsapp /> WhatsApp
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              </section>
            )}
        </main>

        {selectedVendor && (
          <div
            className="vendor-info-overlay"
            onClick={() =>
              setSelectedVendor(null)
            }
          >
            <div
              className="vendor-info-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                className="vendor-info-close"
                onClick={() =>
                  setSelectedVendor(null)
                }
                aria-label="Close vendor details"
              >
                <FiX />
              </button>

              <div className="vendor-info-modal-header">
                <img
                  src={
                    selectedVendor.image_url ||
                    fallbackVendorImage
                  }
                  alt={
                    selectedVendor.name ||
                    "Service provider"
                  }
                />

                <div>
                  <h2>{selectedVendor.name}</h2>

                  <p>
                    {selectedVendor.service_type ||
                      "General Service"}
                  </p>
                </div>
              </div>

              <div className="vendor-info-details">
                <div className="vendor-info-item">
                  <span>Rating</span>

                  <strong>
                    ⭐{" "}
                    {Number(
                      selectedVendor.rating || 0
                    ).toFixed(1)}
                  </strong>
                </div>

                {selectedVendor.city ||
                selectedVendor.address ? (
                  <div className="vendor-info-item">
                    <span>Location</span>

                    <strong>
                      <FiMapPin />

                      {selectedVendor.city ||
                        selectedVendor.address}
                    </strong>
                  </div>
                ) : null}

                {selectedVendor.distance !== null &&
                selectedVendor.distance !== undefined ? (
                  <div className="vendor-info-item">
                    <span>Distance</span>

                    <strong>
                      {selectedVendor.distance.toFixed(
                        1
                      )}{" "}
                      km away
                    </strong>
                  </div>
                ) : null}

                {getStartingPrice(
                  selectedVendor
                ) !== null ? (
                  <div className="vendor-info-item">
                    <span>Starting price</span>

                    <strong>
                      {formatPrice(
                        getStartingPrice(
                          selectedVendor
                        )
                      )}
                    </strong>
                  </div>
                ) : null}

                {selectedVendor.is_verified ? (
                  <div className="vendor-info-item">
                    <span>Status</span>

                    <strong className="info-verified">
                      ✓ Verified
                    </strong>
                  </div>
                ) : null}
              </div>

              {selectedVendor.description && (
                <div className="vendor-info-description">
                  <span>About this provider</span>

                  <p>
                    {selectedVendor.description}
                  </p>
                </div>
              )}

              {selectedVendor.subcategories && (
                <div className="vendor-info-services">
                  <span>Services</span>

                  <div>
                    {(
                      Array.isArray(
                        selectedVendor.subcategories
                      )
                        ? selectedVendor.subcategories
                        : String(
                            selectedVendor.subcategories
                          ).split("||")
                    ).map((service, index) => (
                      <span
                        key={`${service}-${index}`}
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="search-bottom-viewport">
        <nav
          className="bottom-navigation"
          aria-label="Primary navigation"
        >
          {footerItems.map(
            ({ label, path, icon: Icon }) => {
              const active =
                isFooterActive(path);

              return (
                <button
                  type="button"
                  key={path}
                  className={`bottom-nav-item ${
                    active ? "active" : ""
                  }`}
                  aria-current={
                    active ? "page" : undefined
                  }
                  onClick={() => {
                    if (
                      location.pathname !== path
                    ) {
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
            }
          )}
        </nav>
      </div>
    </>
  );
}