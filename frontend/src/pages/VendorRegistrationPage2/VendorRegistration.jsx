import React, { useState } from "react";
import "./VendorRegistration.css";
import { useNavigate } from "react-router-dom";

const VendorRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    whatsapp: "",
    sameAsMobile: false,
    email: "",
    address: "",
    city: "",
    state: "",
    landmark: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNext = (e) => {
    e.preventDefault();

    console.log("Vendor Contact & Location Details:", formData);
    navigate("/vendorRegistrationPage3");
  };

  const handleBack = () => {
    navigate("/vendorRegistration");
  };

  return (
    <div className="vendor-page">
      <div className="vendor-registration-card">

        {/* Header */}
        <header className="vendor-header">
          <button
            type="button"
            className="back-button"
            onClick={handleBack}
            aria-label="Go back"
          >
            <svg
              viewBox="0 0 24 24"
              className="back-icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          <h1>Vendor Registration</h1>
        </header>

        {/* Step Progress */}
        <div className="progress-section">
          <div className="progress-labels">
            <span>Step 2 of 3</span>
            <span>Contact &amp; Location</span>
          </div>

          <div className="progress-track">
            <div className="progress-fill"></div>
          </div>
        </div>

        <form onSubmit={handleNext}>

          {/* Contact Information */}
          <section className="form-section">
            <h2>Contact Information</h2>

            {/* WhatsApp Number */}
            <div className="form-group">
              <label htmlFor="whatsapp">WhatsApp Number</label>

              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M6.6 10.8c1.2 2.4 3.2 4.4 5.6 5.6l1.9-1.9c.3-.3.7-.4 1.1-.2.8.3 1.7.5 2.6.5.6 0 1 .4 1 1V19c0 .6-.4 1-1 1C10.1 20 4 13.9 4 6.3c0-.6.4-1 1-1h3.2c.6 0 1 .4 1 1 0 .9.2 1.8.5 2.6.1.4 0 .8-.2 1.1l-1.9 1.8z" />
                </svg>

                <input
                  id="whatsapp"
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Same as Mobile */}
            <div className="checkbox-group">
              <input
                id="sameAsMobile"
                type="checkbox"
                name="sameAsMobile"
                checked={formData.sameAsMobile}
                onChange={handleChange}
              />

              <label htmlFor="sameAsMobile">
                Same as mobile number from step 1
              </label>
            </div>

            {/* Email */}
            <div className="form-group email-group">
              <label htmlFor="email">Email Address</label>

              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vendor@example.com"
                />
              </div>
            </div>
          </section>

          {/* Location Details */}
          <section className="form-section location-section">
            <h2>Location Details</h2>

            {/* Address */}
            <div className="form-group">
              <label htmlFor="address">Full Street Address</label>

              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>

                <input
                  id="address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Business Parkway, Suite 100"
                />
              </div>
            </div>

            {/* City */}
            <div className="form-group">
              <label htmlFor="city">City</label>

              <input
                id="city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Metropolis"
              />
            </div>

            {/* State */}
            <div className="form-group">
              <label htmlFor="state">State/Region</label>

              <input
                id="state"
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
              />
            </div>

            {/* Landmark */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="landmark">Landmark</label>
                <span>Optional</span>
              </div>

              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M4 4l16 8-16 8 4-8-4-8Z" />
                  <path d="M8 12h7" />
                </svg>

                <input
                  id="landmark"
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="Near the central plaza"
                />
              </div>
            </div>
          </section>

          {/* Bottom Action */}
          <div className="form-actions">
            <button type="submit" className="next-button">
              <span>Next Step</span>

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