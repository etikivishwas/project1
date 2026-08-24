import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiChevronDown, FiArrowRight } from "react-icons/fi";
import "./VendorRegistration.css";

const VendorRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
      businessName: "",
      ownerName: "",
      mobileNumber: "",
      category: "",
      location: "",
    });

  const [errors, setErrors] = useState({});

  const categories = [
    "Plumbing",
    "Electrical",
    "Cleaning",
    "Beauty",
    "Carpentry",
    "Moving",
    "HVAC",
    "Other",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Remove error when user starts correcting the field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    // Limit to 10 digits
    if (value.length <= 10) {
      setFormData((prev) => ({
        ...prev,
        mobileNumber: value,
      }));
    }

    if (errors.mobileNumber) {
      setErrors((prev) => ({
        ...prev,
        mobileNumber: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = "Owner name is required";
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (formData.mobileNumber.length !== 10) {
      newErrors.mobileNumber = "Enter a valid 10-digit mobile number";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Pincode / location is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log("Step 1 data:", formData);
    navigate("/vendorRegistrationPage2", { state: { formData } });
  };

  return (
    <div className="vendor-registration-page">
      <div className="vendor-registration-container">

        {/* =========================================
            HEADER
        ========================================= */}

        <header className="vendor-registration-header">
          <button
            type="button"
            className="vendor-registration-back"
            onClick={() => navigate("/userProfile")}
            aria-label="Go back"
          >
            <FiArrowLeft />
          </button>

          <h1>New Vendor</h1>

          <div className="vendor-header-spacer"></div>
        </header>


        {/* =========================================
            PROGRESS SECTION
        ========================================= */}

        <div className="vendor-progress-section">

          <div className="vendor-progress-header">
            <span>Step 1 of 3</span>
            <span>Business Info</span>
          </div>

          <div className="vendor-progress-track">
            <div className="vendor-progress-fill"></div>
          </div>

        </div>


        {/* =========================================
            FORM CARD
        ========================================= */}

        <main className="vendor-registration-content">

          <form
            className="vendor-registration-form"
            onSubmit={handleNext}
          >

            {/* Business Name */}
            <div className="vendor-form-group">

              <label htmlFor="businessName">
                Business Name
              </label>

              <input
                id="businessName"
                name="businessName"
                type="text"
                placeholder="e.g home cleaning"
                value={formData.businessName}
                onChange={handleChange}
              />

              {errors.businessName && (
                <span className="vendor-form-error">
                  {errors.businessName}
                </span>
              )}

            </div>


            {/* Owner Name */}
            <div className="vendor-form-group">

              <label htmlFor="ownerName">
                Owner Name
              </label>

              <input
                id="ownerName"
                name="ownerName"
                type="text"
                placeholder="e.g Vishwas"
                value={formData.ownerName}
                onChange={handleChange}
              />

              {errors.ownerName && (
                <span className="vendor-form-error">
                  {errors.ownerName}
                </span>
              )}

            </div>


            {/* Mobile Number */}
            <div className="vendor-form-group">

              <label htmlFor="mobileNumber">
                Mobile Number
              </label>

              <div className="vendor-mobile-input">

                <span className="vendor-country-code">
                  +91
                </span>

                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  inputMode="numeric"
                  maxLength="10"
                  placeholder="9876543210"
                  value={formData.mobileNumber}
                  onChange={handleMobileChange}
                />

              </div>

              {errors.mobileNumber && (
                <span className="vendor-form-error">
                  {errors.mobileNumber}
                </span>
              )}

            </div>


            {/* Category */}
            <div className="vendor-form-group">

              <label htmlFor="category">
                Category
              </label>

              <div className="vendor-select-wrapper">

                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">
                    Select a category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>

                <FiChevronDown className="vendor-select-icon" />

              </div>

              {errors.category && (
                <span className="vendor-form-error">
                  {errors.category}
                </span>
              )}

            </div>


            {/* Pincode / Location */}
            <div className="vendor-form-group">

              <label htmlFor="location">
                Pincode / Location
              </label>

              <input
                id="location"
                name="location"
                type="text"
                inputMode="numeric"
                placeholder="e.g 500081"
                value={formData.location}
                onChange={handleChange}
              />

              {errors.location && (
                <span className="vendor-form-error">
                  {errors.location}
                </span>
              )}

            </div>


            {/* Next Button */}
            <button
              type="submit"
              className="vendor-next-button"
            >
              <span>Next</span>
              <FiArrowRight />
            </button>

          </form>

        </main>

      </div>
    </div>
  );
};

export default VendorRegistration;