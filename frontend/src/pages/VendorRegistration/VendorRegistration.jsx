import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiChevronDown,
  FiMapPin,
  FiPhone,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import logo from "../../assets/logo.jpeg";
import "./VendorRegistration.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialFormData = {
  businessName: "",
  ownerName: "",
  mobileNumber: "",
  category: "",
  location: "",
};

const normalizeCategories = (result) => {
  const categoryList = Array.isArray(result)
    ? result
    : Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result?.categories)
        ? result.categories
        : [];

  return categoryList
    .map((category) => ({
      id:
        category.id ??
        category.category_id ??
        category.categoryId,
      name:
        category.name ??
        category.category_name ??
        category.categoryName,
    }))
    .filter(
      (category) =>
        category.id !== undefined &&
        category.id !== null &&
        Boolean(category.name)
    );
};

export default function VendorRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState("");

  const completedFieldCount = useMemo(
    () =>
      Object.values(formData).filter((value) => String(value).trim()).length,
    [formData]
  );

  const removeFieldError = (fieldName) => {
    setErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    removeFieldError(name);
  };

  const handleMobileChange = (event) => {
    const numericValue = event.target.value.replace(/\D/g, "").slice(0, 10);

    setFormData((currentData) => ({
      ...currentData,
      mobileNumber: numericValue,
    }));

    removeFieldError("mobileNumber");
  };

  const handleLocationChange = (event) => {
    const numericValue = event.target.value.replace(/\D/g, "").slice(0, 6);

    setFormData((currentData) => ({
      ...currentData,
      location: numericValue,
    }));

    removeFieldError("location");
  };

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      setCategoryError("");

      const response = await fetch(`${API_URL}/api/vendor-categories`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error("The category service returned an invalid response.");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            `Could not load categories. Status: ${response.status}`
        );
      }

      const normalizedCategories = normalizeCategories(result);

      if (normalizedCategories.length === 0) {
        throw new Error("No vendor categories are currently available.");
      }

      setCategories(normalizedCategories);
    } catch (requestError) {
      console.error("Load categories error:", requestError);
      setCategories([]);
      setCategoryError(
        requestError.message ||
          "Categories could not be loaded. Please try again."
      );
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const validateForm = () => {
    const nextErrors = {};
    const businessName = formData.businessName.trim();
    const ownerName = formData.ownerName.trim();
    const mobileNumber = formData.mobileNumber.trim();
    const location = formData.location.trim();

    if (!businessName) {
      nextErrors.businessName = "Business name is required.";
    } else if (businessName.length < 2) {
      nextErrors.businessName =
        "Business name must contain at least 2 characters.";
    }

    if (!ownerName) {
      nextErrors.ownerName = "Owner name is required.";
    } else if (!/^[a-zA-Z\s.'-]{2,60}$/.test(ownerName)) {
      nextErrors.ownerName = "Enter a valid owner name.";
    }

    if (!mobileNumber) {
      nextErrors.mobileNumber = "Mobile number is required.";
    } else if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      nextErrors.mobileNumber =
        "Enter a valid 10-digit Indian mobile number.";
    }

    if (!formData.category) {
      nextErrors.category = "Please select a category.";
    }

    if (!location) {
      nextErrors.location = "Pincode is required.";
    } else if (!/^[1-9]\d{5}$/.test(location)) {
      nextErrors.location = "Enter a valid 6-digit pincode.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = (event) => {
    event.preventDefault();

    if (loadingCategories) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        category: "Please wait while categories are loading.",
      }));
      return;
    }

    if (categoryError) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        category: "Categories are unavailable. Please retry.",
      }));
      return;
    }

    if (!validateForm()) {
      return;
    }

    const selectedCategory = categories.find(
      (category) => String(category.id) === String(formData.category)
    );

    navigate("/vendorRegistrationPage2", {
      state: {
        step1Data: {
          businessName: formData.businessName.trim(),
          ownerName: formData.ownerName.trim(),
          mobileNumber: formData.mobileNumber,
          categoryId: formData.category,
          categoryName: selectedCategory?.name || "",
          location: formData.location,
        },
      },
    });
  };

  const categoryPlaceholder = loadingCategories
    ? "Loading categories..."
    : categoryError
      ? "Categories unavailable"
      : "Select a category";

  return (
    <div className="vendor-registration-page">
      <div className="vendor-registration-container">
        <header className="vendor-registration-header">
          <button
            type="button"
            className="vendor-registration-back"
            onClick={() => navigate("/userProfile")}
            aria-label="Return to profile"
          >
            <FiArrowLeft />
          </button>

          <div className="vendor-registration-brand">
            <img src={logo} alt="Milieu Global" />
            <span>Vendor Registration</span>
          </div>

          <span className="vendor-header-spacer" />
        </header>

        <main className="vendor-registration-content">
          <section className="vendor-registration-hero">
            <div className="vendor-hero-decoration" />
            <span className="vendor-hero-icon">
              <FaStore />
            </span>
            <small>GROW WITH MILIEU GLOBAL</small>
            <h1>Tell us about your business</h1>
            <p>
              Add the essential business details to begin the vendor
              registration process.
            </p>

            <div className="vendor-progress-card">
              <div className="vendor-progress-title">
                <span>Step 1 of 3</span>
                <strong>Business information</strong>
              </div>

              <div
                className="vendor-progress-track"
                role="progressbar"
                aria-valuemin="1"
                aria-valuemax="3"
                aria-valuenow="1"
                aria-label="Step 1 of 3"
              >
                <span className="vendor-progress-fill" />
              </div>

              <div className="vendor-progress-steps" aria-hidden="true">
                <span className="active">
                  <FiCheck />
                </span>
                <span>2</span>
                <span>3</span>
              </div>
            </div>
          </section>

          <section className="vendor-form-section">
            <div className="vendor-form-heading">
              <div>
                <small>REQUIRED DETAILS</small>
                <h2>Business information</h2>
              </div>
              <span>{completedFieldCount}/5 filled</span>
            </div>

            <form
              className="vendor-registration-form"
              onSubmit={handleNext}
              noValidate
            >
              <div className="vendor-form-group">
                <label htmlFor="businessName">Business name</label>
                <div
                  className={`vendor-input-shell ${
                    errors.businessName ? "invalid" : ""
                  }`}
                >
                  <FiBriefcase />
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    autoComplete="organization"
                    placeholder="For example, Home Cleaning"
                    value={formData.businessName}
                    onChange={handleChange}
                    maxLength={100}
                    aria-invalid={Boolean(errors.businessName)}
                  />
                </div>
                {errors.businessName && (
                  <span className="vendor-form-error" role="alert">
                    {errors.businessName}
                  </span>
                )}
              </div>

              <div className="vendor-form-group">
                <label htmlFor="ownerName">Owner name</label>
                <div
                  className={`vendor-input-shell ${
                    errors.ownerName ? "invalid" : ""
                  }`}
                >
                  <FiUser />
                  <input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    autoComplete="name"
                    placeholder="For example, Vishwas"
                    value={formData.ownerName}
                    onChange={handleChange}
                    maxLength={60}
                    aria-invalid={Boolean(errors.ownerName)}
                  />
                </div>
                {errors.ownerName && (
                  <span className="vendor-form-error" role="alert">
                    {errors.ownerName}
                  </span>
                )}
              </div>

              <div className="vendor-form-group">
                <label htmlFor="mobileNumber">Mobile number</label>
                <div
                  className={`vendor-input-shell vendor-mobile-input ${
                    errors.mobileNumber ? "invalid" : ""
                  }`}
                >
                  <FiPhone />
                  <span className="vendor-country-code">+91</span>
                  <input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.mobileNumber}
                    onChange={handleMobileChange}
                    aria-invalid={Boolean(errors.mobileNumber)}
                  />
                </div>
                {errors.mobileNumber && (
                  <span className="vendor-form-error" role="alert">
                    {errors.mobileNumber}
                  </span>
                )}
              </div>

              <div className="vendor-form-group">
                <label htmlFor="category">Service category</label>
                <div
                  className={`vendor-input-shell vendor-select-wrapper ${
                    errors.category ? "invalid" : ""
                  }`}
                >
                  <FaStore />
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={loadingCategories || Boolean(categoryError)}
                    aria-invalid={Boolean(errors.category)}
                  >
                    <option value="">{categoryPlaceholder}</option>
                    {categories.map((category) => (
                      <option
                        key={String(category.id)}
                        value={String(category.id)}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="vendor-select-icon" />
                </div>

                {categoryError && (
                  <div className="vendor-category-api-error" role="alert">
                    <span>{categoryError}</span>
                    <button
                      type="button"
                      onClick={loadCategories}
                      disabled={loadingCategories}
                    >
                      <FiRefreshCw /> Retry
                    </button>
                  </div>
                )}

                {errors.category && (
                  <span className="vendor-form-error" role="alert">
                    {errors.category}
                  </span>
                )}
              </div>

              <div className="vendor-form-group">
                <label htmlFor="location">Business pincode</label>
                <div
                  className={`vendor-input-shell ${
                    errors.location ? "invalid" : ""
                  }`}
                >
                  <FiMapPin />
                  <input
                    id="location"
                    name="location"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    placeholder="For example, 500081"
                    value={formData.location}
                    onChange={handleLocationChange}
                    aria-invalid={Boolean(errors.location)}
                  />
                </div>
                {errors.location && (
                  <span className="vendor-form-error" role="alert">
                    {errors.location}
                  </span>
                )}
              </div>

              <div className="vendor-form-note">
                <FiCheck />
                <span>
                  These details will be reviewed before the vendor listing is
                  published.
                </span>
              </div>

              <button
                type="submit"
                className="vendor-next-button"
                disabled={loadingCategories || Boolean(categoryError)}
              >
                <span>
                  {loadingCategories ? "Loading categories..." : "Continue"}
                </span>
                <FiArrowRight />
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
