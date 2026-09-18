import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiMail,
  FiMapPin,
  FiNavigation,
  FiPhone,
} from "react-icons/fi";
import { FaStore, FaWhatsapp } from "react-icons/fa";
import logo from "../../assets/logo.jpeg";
import "./VendorRegistration.css";

const readSessionData = (key) => {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return null;
  }
};

const initialStep2Data = {
  whatsapp: "",
  sameAsMobile: false,
  email: "",
  address: "",
  city: "",
  state: "",
  landmark: "",
};

export default function VendorRegistration() {
  const navigate = useNavigate();
  const location = useLocation();

  const step1Data =
    location.state?.step1Data ||
    readSessionData("vendorRegistrationStep1");

  const savedStep2Data =
    location.state?.step2Data ||
    readSessionData("vendorRegistrationStep2");

  const [formData, setFormData] = useState({
    ...initialStep2Data,
    ...(savedStep2Data || {}),
  });
  const [errors, setErrors] = useState({});

  const completedFieldCount = useMemo(() => {
    const requiredValues = [
      formData.whatsapp,
      formData.email,
      formData.address,
      formData.city,
      formData.state,
    ];

    return requiredValues.filter((value) => String(value).trim()).length;
  }, [formData]);

  useEffect(() => {
    if (!step1Data) {
      navigate("/vendorRegistration", {
        replace: true,
        state: { error: "Step 1 information is missing." },
      });
      return;
    }

    sessionStorage.setItem(
      "vendorRegistrationStep1",
      JSON.stringify(step1Data)
    );
  }, [step1Data, navigate]);

  const clearFieldError = (fieldName) => {
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

    clearFieldError(name);
  };

  const handleWhatsAppChange = (event) => {
    const numericValue = event.target.value.replace(/\D/g, "").slice(0, 10);

    setFormData((currentData) => ({
      ...currentData,
      whatsapp: numericValue,
      sameAsMobile: false,
    }));

    clearFieldError("whatsapp");
  };

  const handleSameAsMobile = (event) => {
    const checked = event.target.checked;
    const mobileNumber = String(step1Data?.mobileNumber || "")
      .replace(/\D/g, "")
      .slice(0, 10);

    setFormData((currentData) => ({
      ...currentData,
      sameAsMobile: checked,
      whatsapp: checked ? mobileNumber : "",
    }));

    clearFieldError("whatsapp");
  };

  const validateForm = () => {
    const nextErrors = {};
    const whatsapp = formData.whatsapp.replace(/\D/g, "");
    const email = formData.email.trim().toLowerCase();

    if (!/^[6-9]\d{9}$/.test(whatsapp)) {
      nextErrors.whatsapp = "Enter a valid 10-digit WhatsApp number.";
    }

    if (!email) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formData.address.trim()) {
      nextErrors.address = "Full street address is required.";
    } else if (formData.address.trim().length < 8) {
      nextErrors.address = "Enter a more complete street address.";
    }

    if (!formData.city.trim()) {
      nextErrors.city = "City is required.";
    }

    if (!formData.state.trim()) {
      nextErrors.state = "State or region is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const step2Data = {
      whatsapp: formData.whatsapp.replace(/\D/g, ""),
      sameAsMobile: formData.sameAsMobile,
      email: formData.email.trim().toLowerCase(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      landmark: formData.landmark.trim(),
    };

    sessionStorage.setItem(
      "vendorRegistrationStep1",
      JSON.stringify(step1Data)
    );
    sessionStorage.setItem(
      "vendorRegistrationStep2",
      JSON.stringify(step2Data)
    );

    navigate("/vendorRegistrationPage3", {
      state: { step1Data, step2Data },
    });
  };

  const handleBack = () => {
    sessionStorage.setItem(
      "vendorRegistrationStep2",
      JSON.stringify(formData)
    );

    navigate("/vendorRegistration", {
      state: { step1Data, step2Data: formData },
    });
  };

  if (!step1Data) {
    return null;
  }

  return (
    <div className="vendor-step2-page">
      <div className="vendor-step2-container">
        <header className="vendor-step2-header">
          <button
            type="button"
            className="vendor-step2-back"
            onClick={handleBack}
            aria-label="Return to business information"
          >
            <FiArrowLeft />
          </button>

          <div className="vendor-step2-brand">
            <img src={logo} alt="Milieu Global" />
            <span>Vendor Registration</span>
          </div>

          <span className="vendor-step2-header-spacer" />
        </header>

        <main className="vendor-step2-content">
          <section className="vendor-step2-hero">
            <div className="vendor-step2-decoration" />
            <span className="vendor-step2-hero-icon">
              <FiMapPin />
            </span>
            <small>HELP CUSTOMERS REACH YOU</small>
            <h1>Add contact and location details</h1>
            <p>
              Provide accurate contact information and the business address
              customers should use.
            </p>

            <div className="vendor-step2-progress-card">
              <div className="vendor-step2-progress-title">
                <span>Step 2 of 3</span>
                <strong>Contact &amp; location</strong>
              </div>

              <div
                className="vendor-step2-progress-track"
                role="progressbar"
                aria-valuemin="1"
                aria-valuemax="3"
                aria-valuenow="2"
                aria-label="Step 2 of 3"
              >
                <span className="vendor-step2-progress-fill" />
              </div>

              <div className="vendor-step2-progress-steps" aria-hidden="true">
                <span className="complete">
                  <FiCheck />
                </span>
                <span className="active">2</span>
                <span>3</span>
              </div>
            </div>
          </section>

          <div className="vendor-step2-summary">
            <span className="vendor-step2-summary-icon">
              <FaStore />
            </span>
            <div>
              <small>REGISTERING</small>
              <strong>{step1Data.businessName || "Your business"}</strong>
              <p>
                {step1Data.categoryName || "Service provider"}
                {step1Data.location ? ` · ${step1Data.location}` : ""}
              </p>
            </div>
          </div>

          <div className="vendor-step2-form-heading">
            <div>
              <small>REQUIRED DETAILS</small>
              <h2>Contact and location</h2>
            </div>
            <span>{completedFieldCount}/5 filled</span>
          </div>

          <form
            className="vendor-step2-form"
            onSubmit={handleNext}
            noValidate
          >
            <section className="vendor-step2-form-section">
              <div className="vendor-step2-section-heading">
                <span className="vendor-step2-section-icon">
                  <FiPhone />
                </span>
                <div>
                  <small>CUSTOMER CONTACT</small>
                  <h3>Contact information</h3>
                </div>
              </div>

              <div className="vendor-step2-group">
                <label htmlFor="whatsapp">WhatsApp number</label>
                <div
                  className={`vendor-step2-input-shell vendor-step2-mobile ${
                    errors.whatsapp ? "invalid" : ""
                  }`}
                >
                  <FaWhatsapp />
                  <span className="vendor-step2-country-code">+91</span>
                  <input
                    id="whatsapp"
                    type="tel"
                    name="whatsapp"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={formData.whatsapp}
                    onChange={handleWhatsAppChange}
                    placeholder="9876543210"
                    aria-invalid={Boolean(errors.whatsapp)}
                  />
                </div>
                {errors.whatsapp && (
                  <span className="vendor-step2-error" role="alert">
                    {errors.whatsapp}
                  </span>
                )}
              </div>

              <label className="vendor-step2-checkbox">
                <input
                  type="checkbox"
                  name="sameAsMobile"
                  checked={formData.sameAsMobile}
                  onChange={handleSameAsMobile}
                />
                <span className="vendor-step2-checkbox-box">
                  <FiCheck />
                </span>
                <span>Use the mobile number entered in Step 1</span>
              </label>

              <div className="vendor-step2-group vendor-step2-last-group">
                <label htmlFor="email">Email address</label>
                <div
                  className={`vendor-step2-input-shell ${
                    errors.email ? "invalid" : ""
                  }`}
                >
                  <FiMail />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder="vendor@example.com"
                    aria-invalid={Boolean(errors.email)}
                  />
                </div>
                {errors.email && (
                  <span className="vendor-step2-error" role="alert">
                    {errors.email}
                  </span>
                )}
              </div>
            </section>

            <section className="vendor-step2-form-section">
              <div className="vendor-step2-section-heading">
                <span className="vendor-step2-section-icon location">
                  <FiNavigation />
                </span>
                <div>
                  <small>BUSINESS ADDRESS</small>
                  <h3>Location details</h3>
                </div>
              </div>

              <div className="vendor-step2-group">
                <label htmlFor="address">Full street address</label>
                <div
                  className={`vendor-step2-input-shell ${
                    errors.address ? "invalid" : ""
                  }`}
                >
                  <FiMapPin />
                  <input
                    id="address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    autoComplete="street-address"
                    placeholder="House number, street, locality"
                    aria-invalid={Boolean(errors.address)}
                  />
                </div>
                {errors.address && (
                  <span className="vendor-step2-error" role="alert">
                    {errors.address}
                  </span>
                )}
              </div>

              <div className="vendor-step2-grid">
                <div className="vendor-step2-group">
                  <label htmlFor="city">City</label>
                  <div
                    className={`vendor-step2-input-shell ${
                      errors.city ? "invalid" : ""
                    }`}
                  >
                    <input
                      id="city"
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      autoComplete="address-level2"
                      placeholder="Hyderabad"
                      aria-invalid={Boolean(errors.city)}
                    />
                  </div>
                  {errors.city && (
                    <span className="vendor-step2-error" role="alert">
                      {errors.city}
                    </span>
                  )}
                </div>

                <div className="vendor-step2-group">
                  <label htmlFor="state">State / region</label>
                  <div
                    className={`vendor-step2-input-shell ${
                      errors.state ? "invalid" : ""
                    }`}
                  >
                    <input
                      id="state"
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      autoComplete="address-level1"
                      placeholder="Telangana"
                      aria-invalid={Boolean(errors.state)}
                    />
                  </div>
                  {errors.state && (
                    <span className="vendor-step2-error" role="alert">
                      {errors.state}
                    </span>
                  )}
                </div>
              </div>

              <div className="vendor-step2-group vendor-step2-last-group">
                <div className="vendor-step2-label-row">
                  <label htmlFor="landmark">Landmark</label>
                  <span>Optional</span>
                </div>
                <div className="vendor-step2-input-shell">
                  <FiNavigation />
                  <input
                    id="landmark"
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Near a well-known place"
                  />
                </div>
              </div>
            </section>

            <div className="vendor-step2-note">
              <FiCheck />
              <span>
                Contact details may be shown to customers after the vendor
                listing is approved.
              </span>
            </div>

            <div className="vendor-step2-actions">
              <button
                type="button"
                className="vendor-step2-secondary"
                onClick={handleBack}
              >
                Back
              </button>

              <button type="submit" className="vendor-step2-primary">
                <span>Continue</span>
                <FiArrowRight />
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
