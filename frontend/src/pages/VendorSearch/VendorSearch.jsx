import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FiArrowLeft,
    FiSliders,
    FiChevronDown,
    FiPhone,
    FiMessageSquare,
    FiHome,
    FiSearch,
    FiClock,
    FiMapPin,
    FiX,
} from "react-icons/fi";

import "./VendorSearch.css";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

function VendorSearch() {
    const navigate = useNavigate();

    // =====================================================
    // STATE
    // =====================================================

    const [searchText, setSearchText] = useState("");

    const [allVendors, setAllVendors] = useState([]);

    const [hasSearched, setHasSearched] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    // Filters
    const [priceFilter, setPriceFilter] = useState("default");
    const [distanceFilter, setDistanceFilter] = useState("default");
    const [ratingFilter, setRatingFilter] = useState("default");

    // =====================================================
    // FETCH EXISTING VENDORS API
    // =====================================================

    useEffect(() => {
        const fetchVendors = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${API_URL}/api/vendors`
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch vendors");
                }

                const result = await response.json();

                /*
                  Existing API response:
        
                  {
                    success: true,
                    count: ...,
                    data: [...]
                  }
                */

                setAllVendors(result.data || []);
            } catch (err) {
                console.error("Vendor fetch error:", err);

                setError(
                    "Unable to load service providers."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchVendors();
    }, []);

    // =====================================================
    // SEARCH + FILTER LOGIC
    // =====================================================

    const filteredVendors = useMemo(() => {
        if (!hasSearched || !searchText.trim()) {
            return [];
        }

        const query = searchText.trim().toLowerCase();

        // ---------------------------------------------------
        // SEARCH
        // ---------------------------------------------------

        let results = allVendors.filter((vendor) => {
            const name =
                vendor.name?.toLowerCase() || "";

            const service =
                vendor.service_type?.toLowerCase() || "";

            const description =
                vendor.description?.toLowerCase() || "";

            const address =
                vendor.address?.toLowerCase() || "";

            const city =
                vendor.city?.toLowerCase() || "";

            return (
                name.includes(query) ||
                service.includes(query) ||
                description.includes(query) ||
                address.includes(query) ||
                city.includes(query)
            );
        });

        /*
          Example:
    
          Search:
          "electrician"
    
          Matches:
          service_type = Electrician
    
          Search:
          "kukatpally"
    
          Matches:
          address/city = Kukatpally
        */

        // ===================================================
        // PRICE FILTER
        // ===================================================

        if (priceFilter === "low") {
            results.sort((a, b) => {
                const priceA =
                    Number(
                        a.starting_price ??
                        a.price ??
                        Infinity
                    );

                const priceB =
                    Number(
                        b.starting_price ??
                        b.price ??
                        Infinity
                    );

                return priceA - priceB;
            });
        }

        if (priceFilter === "high") {
            results.sort((a, b) => {
                const priceA =
                    Number(
                        a.starting_price ??
                        a.price ??
                        0
                    );

                const priceB =
                    Number(
                        b.starting_price ??
                        b.price ??
                        0
                    );

                return priceB - priceA;
            });
        }

        // ===================================================
        // DISTANCE FILTER
        // ===================================================

        if (distanceFilter === "near") {
            results.sort((a, b) => {
                const distanceA =
                    Number(a.distance ?? Infinity);

                const distanceB =
                    Number(b.distance ?? Infinity);

                return distanceA - distanceB;
            });
        }

        if (distanceFilter === "far") {
            results.sort((a, b) => {
                const distanceA =
                    Number(a.distance ?? 0);

                const distanceB =
                    Number(b.distance ?? 0);

                return distanceB - distanceA;
            });
        }

        // ===================================================
        // RATING FILTER
        // ===================================================

        if (ratingFilter === "high") {
            results.sort(
                (a, b) =>
                    Number(b.rating || 0) -
                    Number(a.rating || 0)
            );
        }

        if (ratingFilter === "low") {
            results.sort(
                (a, b) =>
                    Number(a.rating || 0) -
                    Number(b.rating || 0)
            );
        }

        return results;
    }, [
        allVendors,
        searchText,
        hasSearched,
        priceFilter,
        distanceFilter,
        ratingFilter,
    ]);

    // =====================================================
    // SEARCH
    // =====================================================

    const handleSearch = () => {
        const query = searchText.trim();

        if (!query) {
            setHasSearched(false);
            return;
        }

        setHasSearched(true);
    };

    // =====================================================
    // ENTER KEY
    // =====================================================

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    };

    // =====================================================
    // CLEAR SEARCH
    // =====================================================

    const handleClearSearch = () => {
        setSearchText("");
        setHasSearched(false);

        setPriceFilter("default");
        setDistanceFilter("default");
        setRatingFilter("default");
    };

    // =====================================================
    // BACK
    // =====================================================

    const handleBack = () => {
        navigate("/userScreen");
    };

    // =====================================================
    // HOME
    // =====================================================

    const handleHome = () => {
        navigate("/userScreen");
    };

    // =====================================================
    // HISTORY
    // =====================================================

    const handleHistory = () => {
        navigate("/userHistory");
    };

    // =====================================================
    // CALL
    // =====================================================

    const handleCall = (phone) => {
        if (!phone) return;

        window.location.href = `tel:${phone}`;
    };

    // =====================================================
    // WHATSAPP
    // =====================================================

    const handleWhatsApp = (phone) => {
        if (!phone) return;

        const cleanNumber = phone.replace(/\D/g, "");

        const whatsappNumber =
            cleanNumber.length === 10
                ? `91${cleanNumber}`
                : cleanNumber;

        window.open(
            `https://wa.me/${whatsappNumber}`,
            "_blank"
        );
    };

    // =====================================================
    // FORMAT PRICE
    // =====================================================

    const getStartingPrice = (vendor) => {
        const price =
            vendor.starting_price ??
            vendor.price;

        if (
            price === null ||
            price === undefined ||
            price === ""
        ) {
            return null;
        }

        return Number(price);
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="vendor-search-page">

            {/* =================================================
          HEADER
          ================================================= */}

            <header className="vendor-search-header">

                <button
                    className="vendor-back-button"
                    onClick={handleBack}
                    aria-label="Go back"
                >
                    <FiArrowLeft />
                </button>

                <div className="search-header-text">

                    <span>
                        Searching for
                    </span>

                    <h1>
                        {searchText.trim()
                            ? searchText
                            : "Find a service provider"}
                    </h1>

                </div>

                <button
                    className="filter-icon-button"
                    aria-label="Filters"
                >
                    <FiSliders />
                </button>

            </header>


            {/* =================================================
          SEARCH BAR
          ================================================= */}

            <div className="vendor-search-bar-wrapper">

                <div className="vendor-search-input-container">

                    <FiSearch className="search-input-icon" />

                    <input
                        type="text"
                        value={searchText}
                        onChange={(e) =>
                            setSearchText(e.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        placeholder="Search service or location..."
                        className="vendor-search-input"
                    />

                    {searchText && (
                        <button
                            className="clear-search-button"
                            onClick={handleClearSearch}
                            aria-label="Clear search"
                        >
                            <FiX />
                        </button>
                    )}

                </div>

                <button
                    className="vendor-search-button"
                    onClick={handleSearch}
                >
                    <FiSearch />
                    <span>Search</span>
                </button>

            </div>


            {/* =================================================
          FILTERS
          ================================================= */}

            {hasSearched && filteredVendors.length > 0 && (

                <div className="vendor-filter-row">

                    {/* PRICE */}

                    <select
                        className="filter-select"
                        value={priceFilter}
                        onChange={(e) =>
                            setPriceFilter(e.target.value)
                        }
                    >
                        <option value="default">
                            Price
                        </option>

                        <option value="low">
                            Price: Low → High
                        </option>

                        <option value="high">
                            Price: High → Low
                        </option>
                    </select>


                    {/* DISTANCE */}

                    <select
                        className="filter-select"
                        value={distanceFilter}
                        onChange={(e) =>
                            setDistanceFilter(e.target.value)
                        }
                    >
                        <option value="default">
                            Distance
                        </option>

                        <option value="near">
                            Nearest First
                        </option>

                        <option value="far">
                            Farthest First
                        </option>
                    </select>


                    {/* RATING */}

                    <select
                        className="filter-select"
                        value={ratingFilter}
                        onChange={(e) =>
                            setRatingFilter(e.target.value)
                        }
                    >
                        <option value="default">
                            Rating
                        </option>

                        <option value="high">
                            Highest Rated
                        </option>

                        <option value="low">
                            Lowest Rated
                        </option>
                    </select>

                </div>
            )}


            {/* =================================================
          MAIN
          ================================================= */}

            <main className="vendor-search-content">

                {/* =================================================
            ERROR
            ================================================= */}

                {error && (
                    <div className="search-status">

                        <h2>
                            Something went wrong
                        </h2>

                        <p>
                            {error}
                        </p>

                    </div>
                )}


                {/* =================================================
            INITIAL STATE
            ================================================= */}

                {!loading &&
                    !error &&
                    !hasSearched && (

                        <div className="search-empty-state">

                            <div className="search-empty-icon">
                                <FiSearch />
                            </div>

                            <h2>
                                Find the right service provider
                            </h2>

                            <p>
                                Search for a service or location
                                to discover available providers.
                            </p>

                        </div>
                    )}


                {/* =================================================
            LOADING
            ================================================= */}

                {loading && (

                    <div className="search-status">

                        <div className="loading-spinner"></div>

                        <p>
                            Loading service providers...
                        </p>

                    </div>
                )}


                {/* =================================================
            NO RESULTS
            ================================================= */}

                {!loading &&
                    !error &&
                    hasSearched &&
                    filteredVendors.length === 0 && (

                        <div className="search-status">

                            <div className="no-results-icon">
                                <FiSearch />
                            </div>

                            <h2>
                                No vendors found
                            </h2>

                            <p>
                                Try another service or location.
                            </p>

                        </div>
                    )}


                {/* =================================================
            RESULTS
            ================================================= */}

                {!loading &&
                    !error &&
                    hasSearched &&
                    filteredVendors.length > 0 && (

                        <div className="vendor-results">

                            <div className="results-header">

                                <h2>
                                    {filteredVendors.length}{" "}
                                    {filteredVendors.length === 1
                                        ? "provider"
                                        : "providers"}{" "}
                                    found
                                </h2>

                            </div>


                            {filteredVendors.map((vendor) => {

                                const startingPrice =
                                    getStartingPrice(vendor);

                                return (

                                    <div
                                        className={`vendor-card ${vendor.is_premium
                                                ? "premium-card"
                                                : ""
                                            }`}
                                        key={vendor.id}
                                    >

                                        {/* -----------------------------------
                        VENDOR INFORMATION
                        ----------------------------------- */}

                                        <div className="vendor-card-top">

                                            <div className="vendor-image">

                                                {vendor.image_url ? (

                                                    <img
                                                        src={vendor.image_url}
                                                        alt={vendor.name}
                                                    />

                                                ) : (

                                                    <div className="vendor-image-placeholder">
                                                        MG
                                                    </div>

                                                )}

                                            </div>


                                            <div className="vendor-main-info">

                                                <div className="vendor-name-row">

                                                    <h3>
                                                        {vendor.name}
                                                    </h3>

                                                    {Boolean(vendor.is_premium) && (
                                                        <span className="premium-badge">
                                                            ★ PREMIUM
                                                        </span>
                                                    )}

                                                </div>


                                                <div className="vendor-meta">

                                                    {Boolean(vendor.is_verified) && (
                                                        <span className="verified-badge">
                                                            ✓ Verified
                                                        </span>
                                                    )}

                                                    {vendor.distance !==
                                                        undefined &&
                                                        vendor.distance !==
                                                        null && (

                                                            <span className="distance">

                                                                <FiMapPin />

                                                                {Number(
                                                                    vendor.distance
                                                                ).toFixed(1)}{" "}
                                                                km away

                                                            </span>
                                                        )}

                                                </div>


                                                {startingPrice !== null && (

                                                    <p className="starting-price">
                                                        Starting ₹
                                                        {startingPrice}
                                                    </p>

                                                )}

                                            </div>

                                        </div>


                                        {/* -----------------------------------
                        ACTIONS
                        ----------------------------------- */}

                                        <div className="vendor-actions">

                                            <button
                                                className="call-button"
                                                onClick={() =>
                                                    handleCall(
                                                        vendor.phone
                                                    )
                                                }
                                            >
                                                <FiPhone />
                                                Call Now
                                            </button>


                                            <button
                                                className="whatsapp-button"
                                                onClick={() =>
                                                    handleWhatsApp(
                                                        vendor.whatsapp ||
                                                        vendor.phone
                                                    )
                                                }
                                            >
                                                <FiMessageSquare />
                                                WhatsApp
                                            </button>

                                        </div>

                                    </div>
                                );
                            })}

                        </div>
                    )}

            </main>


            {/* =================================================
          BOTTOM NAVIGATION
          ================================================= */}

            <div className="bottom-navigation">

                <button
                    className="bottom-nav-item"
                    onClick={() => navigate("/userScreen")}
                >
                    <FiHome />
                    <span>Home</span>
                </button>

                <button
                    className="bottom-nav-item active"
                    onClick={() => {
                        // Already on Vendor Search
                    }}
                >
                    <FiSearch />
                    <span>Search</span>
                </button>

                <button
                    className="bottom-nav-item"
                    onClick={() => navigate("/userHistory")}
                >
                    <FiClock />
                    <span>History</span>
                </button>

            </div>

        </div>
    );
}

export default VendorSearch;