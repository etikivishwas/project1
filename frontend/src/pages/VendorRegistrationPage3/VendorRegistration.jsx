import React, { useRef, useState } from "react";
import "./VendorRegistration.css";

const VendorRegistration = () => {
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    logo: null,
    aboutBusiness: "",
    experience: "",
    minPrice: "",
    maxPrice: "",
    openingTime: "",
    closingTime: "",
  });

  const [logoPreview, setLogoPreview] = useState(null);

  const [selectedServices, setSelectedServices] = useState([]);

  const [customService, setCustomService] = useState("");

  const services = [
    "Consulting",
    "Design",
    "Development",
    "Marketing",
    "Maintenance",
  ];

  /* ================================
     INPUT HANDLER
  ================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================================
     SERVICE SELECTION
  ================================= */

  const toggleService = (service) => {
    setSelectedServices((prev) => {
      if (prev.includes(service)) {
        return prev.filter((item) => item !== service);
      }

      return [...prev, service];
    });
  };

  /* ================================
     FILE UPLOAD
  ================================= */

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    processFile(file);
  };

  const processFile = (file) => {
    // Only allow images
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    // Maximum 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      logo: file,
    }));

    const previewUrl = URL.createObjectURL(file);

    setLogoPreview(previewUrl);
  };

  /* ================================
     DRAG & DROP
  ================================= */

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    processFile(file);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  /* ================================
     CUSTOM SERVICE
  ================================= */

  const handleAddCustomService = () => {
    const service = customService.trim();

    if (!service) {
      return;
    }

    if (!selectedServices.includes(service)) {
      setSelectedServices((prev) => [...prev, service]);
    }

    setCustomService("");
  };

  /* ================================
     VALIDATION
  ================================= */

  const validateForm = () => {
    if (!formData.aboutBusiness.trim()) {
      alert("Please enter information about your business.");
      return false;
    }

    if (!formData.experience) {
      alert("Please select your years of experience.");
      return false;
    }

    if (selectedServices.length === 0) {
      alert("Please select at least one service.");
      return false;
    }

    if (!formData.minPrice || !formData.maxPrice) {
      alert("Please enter your pricing details.");
      return false;
    }

    return true;
  };

  /* ================================
     COMPLETE REGISTRATION
  ================================= */

  const handleCompleteRegistration = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const finalVendorData = {
      ...formData,
      services: selectedServices,
    };

    console.log("Final Vendor Registration Data:", finalVendorData);

    // API call can be made here
    //
    // Example:
    // await axios.post("/api/vendors", finalVendorData);

    alert("Vendor registration completed successfully!");
  };

  /* ================================
     SAVE FOR LATER
  ================================= */

  const handleSaveForLater = () => {
    const savedData = {
      ...formData,
      services: selectedServices,
    };

    localStorage.setItem(
      "vendorRegistrationStep3",
      JSON.stringify({
        ...savedData,
        logo: null,
      })
    );

    alert("Your progress has been saved.");
  };

  return (
    <div className="vendor-step3-page">

      <div className="vendor-step3-card">

        {/* =================================
            HEADER
        ================================= */}

        <header className="vendor-step3-header">

          <button
            type="button"
            className="step3-back-button"
            onClick={() => window.history.back()}
            aria-label="Go back"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          <h1>
            Vendor
            <br />
            Registration
          </h1>

          <div className="step3-header-progress">
            <span>Step 3 of</span>
            <span>3</span>
          </div>

        </header>


        {/* =================================
            PROGRESS
        ================================= */}

        <div className="step3-progress-section">

          <div className="step3-progress-labels">
            <span>Step 3 of 3</span>
            <span>Business Details</span>
          </div>

          <div className="step3-progress-track">

            <div className="step3-progress-fill"></div>

          </div>

        </div>


        <form onSubmit={handleCompleteRegistration}>

          {/* =================================
              BUSINESS DETAILS
          ================================= */}

          <section className="step3-form-section">

            <div className="step3-section-heading">

              <h2>Business Details &amp; Services</h2>

              <p>
                Tell us more about what you offer to
                <br />
                complete your profile.
              </p>

            </div>


            {/* Small step indicator */}

            <div className="business-mini-progress">

              <span></span>
              <span></span>
              <span className="active"></span>

            </div>


            {/* =================================
                PROFILE PHOTO
            ================================= */}

            <div className="step3-form-group">

              <label className="step3-label">
                Profile Photo / Logo
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden-file-input"
              />

              <div
                className={`logo-upload-box ${
                  logoPreview ? "has-preview" : ""
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFilePicker}
              >

                {logoPreview ? (
                  <div className="logo-preview-container">

                    <img
                      src={logoPreview}
                      alt="Business logo preview"
                      className="logo-preview"
                    />

                    <button
                      type="button"
                      className="remove-logo-button"
                      onClick={(e) => {
                        e.stopPropagation();

                        setLogoPreview(null);

                        setFormData((prev) => ({
                          ...prev,
                          logo: null,
                        }));
                      }}
                    >
                      ×
                    </button>

                  </div>
                ) : (
                  <>
                    <div className="upload-icon-circle">

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <rect
                          x="4"
                          y="4"
                          width="16"
                          height="16"
                          rx="2"
                        />

                        <circle
                          cx="9"
                          cy="9"
                          r="1.5"
                        />

                        <path d="m5 17 4-4 3 3 2-2 5 5" />
                      </svg>

                    </div>

                    <p className="upload-main-text">
                      Drag and drop your logo here
                    </p>

                    <p className="upload-browse-text">
                      or click to browse.
                    </p>

                    <p className="upload-file-info">
                      JPG, PNG up to 5MB
                    </p>
                  </>
                )}

              </div>

            </div>


            {/* =================================
                ABOUT BUSINESS
            ================================= */}

            <div className="step3-form-group">

              <label
                htmlFor="aboutBusiness"
                className="step3-label"
              >
                About the Business
              </label>

              <textarea
                id="aboutBusiness"
                name="aboutBusiness"
                value={formData.aboutBusiness}
                onChange={handleChange}
                placeholder="Describe your expertise, mission, and what makes your service unique..."
                className="business-description"
                rows="4"
              />

            </div>


            {/* =================================
                EXPERIENCE
            ================================= */}

            <div className="step3-form-group">

              <label
                htmlFor="experience"
                className="step3-label"
              >
                Years of Experience
              </label>

              <div className="select-wrapper">

                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                >
                  <option value="">
                    Select years in business
                  </option>

                  <option value="less-than-1">
                    Less than 1 year
                  </option>

                  <option value="1-3">
                    1 - 3 years
                  </option>

                  <option value="3-5">
                    3 - 5 years
                  </option>

                  <option value="5-10">
                    5 - 10 years
                  </option>

                  <option value="10+">
                    10+ years
                  </option>

                </select>

                <svg
                  className="select-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>

              </div>

            </div>


            {/* =================================
                SERVICES
            ================================= */}

            <div className="step3-form-group">

              <label className="step3-label">
                Services Offered
              </label>

              <div className="services-container">

                {services.map((service) => (
                  <button
                    key={service}
                    type="button"
                    className={`service-chip ${
                      selectedServices.includes(service)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => toggleService(service)}
                  >
                    {service}
                  </button>
                ))}

                {selectedServices
                  .filter(
                    (service) => !services.includes(service)
                  )
                  .map((service) => (
                    <button
                      key={service}
                      type="button"
                      className="service-chip selected custom-chip"
                      onClick={() => toggleService(service)}
                    >
                      {service}
                    </button>
                  ))}

                <button
                  type="button"
                  className="service-chip add-custom-chip"
                  onClick={() => {
                    const value = window.prompt(
                      "Enter custom service"
                    );

                    if (value?.trim()) {
                      const service = value.trim();

                      if (!selectedServices.includes(service)) {
                        setSelectedServices((prev) => [
                          ...prev,
                          service,
                        ]);
                      }
                    }
                  }}
                >
                  + Add Custom
                </button>

              </div>

            </div>


            {/* =================================
                PRICING
            ================================= */}

            <div className="pricing-section">

              <div className="pricing-heading">

                <h3>Pricing Details</h3>

                <p>
                  Set a general price range for your services.
                </p>

              </div>

              <div className="pricing-inputs">

                <div className="price-group">

                  <label htmlFor="minPrice">
                    Min Price ($)
                  </label>

                  <input
                    id="minPrice"
                    name="minPrice"
                    type="number"
                    min="0"
                    value={formData.minPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                  />

                </div>


                <div className="price-group">

                  <label htmlFor="maxPrice">
                    Max Price ($)
                  </label>

                  <input
                    id="maxPrice"
                    name="maxPrice"
                    type="number"
                    min="0"
                    value={formData.maxPrice}
                    onChange={handleChange}
                    placeholder="0.00"
                  />

                </div>

              </div>

            </div>


            {/* =================================
                BUSINESS HOURS
            ================================= */}

            <div className="business-hours-section">

              <h3>Business Hours</h3>

              <div className="business-hours-inputs">

                <div className="time-group">

                  <label htmlFor="openingTime">
                    Opening Time
                  </label>

                  <div className="time-input-wrapper">

                    <input
                      id="openingTime"
                      name="openingTime"
                      type="time"
                      value={formData.openingTime}
                      onChange={handleChange}
                    />

                  </div>

                </div>


                <div className="time-group">

                  <label htmlFor="closingTime">
                    Closing Time
                  </label>

                  <div className="time-input-wrapper">

                    <input
                      id="closingTime"
                      name="closingTime"
                      type="time"
                      value={formData.closingTime}
                      onChange={handleChange}
                    />

                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* =================================
              FOOTER ACTIONS
          ================================= */}

          <div className="step3-actions">

            <button
              type="button"
              className="save-later-button"
              onClick={handleSaveForLater}
            >
              Save for
              <br />
              later
            </button>

            <button
              type="submit"
              className="complete-button"
            >
              <span>
                Complete
                <br />
                Registration
              </span>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};

export default VendorRegistration;