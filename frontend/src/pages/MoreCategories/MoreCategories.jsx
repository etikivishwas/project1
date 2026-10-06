import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiChevronRight,
} from "react-icons/fi";
import "./MoreCategories.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

/*
 * DB icon identifier -> existing public icon
 */


const categoryIconMap = {
  FaWrench: "/icons/plumbing.png",
  FaBolt: "/icons/electrical.png",
  FaBroom: "/icons/cleaning.png",
  FaSpa: "/icons/beauty.png",
  FaPaintRoller: "/icons/carpentry.png",
  FaTruckMoving: "/icons/moving.png",
  FaSnowflake: "/icons/hvac.png",
};


const getCategoryIcon = (icon) => {
  if (!icon) return null;

  // Cloudinary / external URL
  if (
    icon.startsWith("https://") ||
    icon.startsWith("http://")
  ) {
    return icon;
  }

  // Uploaded image
  if (icon.startsWith("/uploads/")) {
    return `${API_BASE_URL}${icon}`;
  }

  // Existing frontend icon
  if (icon.startsWith("/icons/")) {
    return icon;
  }

  // FontAwesome category icon
  if (
    Object.prototype.hasOwnProperty.call(
      categoryIconMap,
      icon
    )
  ) {
    return categoryIconMap[icon];
  }

  // Unknown/generic icon
  return null;
};

export default function MoreCategories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] =
  useState(null);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/vendor-categories`
        );

        const result = await response.json();

        if (result.success) {
          setCategories(result.data || []);
        } else {
          console.error(
            "Failed to load categories:",
            result.message
          );
        }
      } catch (error) {
        console.error(
          "Error fetching categories:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleCategory = (categoryId) => {
  setExpandedCategory((current) =>
    current === categoryId ? null : categoryId
  );
};

  const handleCategoryClick = (category) => {
  navigate(
    `/vendorSearch?search=${encodeURIComponent(
      category.name
    )}`
  );
};



  return (
    <div className="more-categories-page">

      {/* Header */}
      <header className="more-categories-header">

        <button
          type="button"
          className="more-categories-back"
          onClick={() => navigate("/userScreen")}
          aria-label="Go back"
        >
          <FiArrowLeft />
        </button>

        <div className="more-categories-title">
          <small>DISCOVER SERVICES</small>
          <h1>All Services</h1>
        </div>

      </header>

      {/* Content */}
      <main className="more-categories-content">

        <p className="more-categories-subtitle">
          Find trusted local professionals for every service.
        </p>

        {loading && (
          <div className="more-categories-loading">
            Loading services...
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="more-categories-grid">

            {categories.map((category) => (
  <div
  key={category.id}
  className="more-category-group"
>
  <div className="more-category-card">

    {/* Category search */}
    <button
      type="button"
      className="more-category-main"
      onClick={() =>
        handleCategoryClick(category)
      }
    >
      <span className="more-category-icon">
        {getCategoryIcon(category.icon) ? (
          <img
            src={getCategoryIcon(category.icon)}
            alt={category.name}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="more-category-image-placeholder" />
        )}
      </span>

      <span className="more-category-name">
        {category.name}
      </span>
    </button>

    {/* Expand subcategories */}
    {category.subcategories?.length > 0 && (
      <button
        type="button"
        className="more-category-expand"
        onClick={() =>
          toggleCategory(category.id)
        }
        aria-label={`Show ${category.name} subcategories`}
      >
        <FiChevronRight
          className={
            expandedCategory === category.id
              ? "expanded"
              : ""
          }
        />
      </button>
    )}
  </div>

  {/* Subcategories */}
  {expandedCategory === category.id &&
    category.subcategories?.length > 0 && (
      <div className="more-subcategories">
        {category.subcategories.map((service) => (
          <button
            key={service.id}
            type="button"
            className="more-subcategory"
            onClick={() =>
              navigate(
                `/vendorSearch?search=${encodeURIComponent(
                  service.name
                )}`
              )
            }
          >
            <span>{service.name}</span>
            <FiChevronRight />
          </button>
        ))}
      </div>
    )}
</div>
))}

          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="more-categories-empty">
            <p>No services available right now.</p>
          </div>
        )}

      </main>

    </div>
  );
}