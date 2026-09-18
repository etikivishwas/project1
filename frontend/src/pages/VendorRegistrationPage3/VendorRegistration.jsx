import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiClock,
  FiDollarSign,
  FiEye,
  FiEyeOff,
  FiImage,
  FiLock,
  FiMail,
  FiPlus,
  FiSave,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import logo from "../../assets/logo.jpeg";
import "./VendorRegistration.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png"];
const DEFAULT_SERVICES = [
  "Consulting",
  "Design",
  "Development",
  "Marketing",
  "Maintenance",
];

const readSessionData = (key) => {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Unable to read ${key}:`, error);
    return null;
  }
};

const getAccessToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

const initialFormData = {
  logo: null,
  aboutBusiness: "",
  experience: "",
  minPrice: "",
  maxPrice: "",
  openingTime: "",
  closingTime: "",
  loginEmail: "",
  password: "",
  confirmPassword: "",
};

export default function VendorRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const step1Data =
    location.state?.step1Data ||
    readSessionData("vendorRegistrationStep1");
  const step2Data =
    location.state?.step2Data ||
    readSessionData("vendorRegistrationStep2");
  const savedDraft = readSessionData("vendorRegistrationStep3");

  const [formData, setFormData] = useState({
    ...initialFormData,
    ...savedDraft,
    logo: null,
    loginEmail: savedDraft?.loginEmail || step2Data?.email || "",
    password: "",
    confirmPassword: "",
  });
  const [selectedServices, setSelectedServices] = useState(
    Array.isArray(savedDraft?.services) ? savedDraft.services : []
  );
  const [customService, setCustomService] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [draftNotice, setDraftNotice] = useState("");

  const completedSectionCount = useMemo(() => {
    const sections = [
      Boolean(formData.aboutBusiness.trim() && formData.experience),
      Boolean(
        selectedServices.length &&
          formData.minPrice !== "" &&
          formData.maxPrice !== ""
      ),
      Boolean(formData.openingTime && formData.closingTime),
      Boolean(
        formData.loginEmail.trim() &&
          formData.password &&
          formData.confirmPassword
      ),
    ];

    return sections.filter(Boolean).length;
  }, [formData, selectedServices]);

  useEffect(() => {
    if (!step1Data || !step2Data) {
      setSubmitError(
        "Previous registration information is missing. Please restart the registration."
      );
      return;
    }

    sessionStorage.setItem(
      "vendorRegistrationStep1",
      JSON.stringify(step1Data)
    );
    sessionStorage.setItem(
      "vendorRegistrationStep2",
      JSON.stringify(step2Data)
    );
  }, [step1Data, step2Data]);

  useEffect(() => {
    if (step2Data?.email) {
      setFormData((currentData) => ({
        ...currentData,
        loginEmail: currentData.loginEmail || step2Data.email,
      }));
    }
  }, [step2Data]);

  useEffect(
    () => () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    },
    [logoPreview]
  );

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
    setSubmitError("");
  };

  const toggleService = (service) => {
    setSelectedServices((currentServices) =>
      currentServices.includes(service)
        ? currentServices.filter((item) => item !== service)
        : [...currentServices, service]
    );
    clearFieldError("services");
    setSubmitError("");
  };

  const addCustomService = () => {
    const nextService = customService.trim();

    if (!nextService) {
      return;
    }

    setSelectedServices((currentServices) => {
      const exists = currentServices.some(
        (item) => item.toLowerCase() === nextService.toLowerCase()
      );

      return exists ? currentServices : [...currentServices, nextService];
    });

    setCustomService("");
    clearFieldError("services");
  };

  const processFile = (file) => {
    setSubmitError("");
    clearFieldError("logo");

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        logo: "Only JPG, JPEG, and PNG files are allowed.",
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        logo: "The logo must be smaller than 5 MB.",
      }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFormData((currentData) => ({
      ...currentData,
      logo: file,
    }));

    setLogoPreview((currentPreview) => {
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      return URL.createObjectURL(file);
    });
  };

  const removeLogo = (event) => {
    event.stopPropagation();

    setLogoPreview((currentPreview) => {
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      return null;
    });

    setFormData((currentData) => ({
      ...currentData,
      logo: null,
    }));

    if (fileInputRef.current) fileInputRef.current.value = "";
    clearFieldError("logo");
  };

  const validateForm = () => {
    const nextErrors = {};
    const minPrice = Number(formData.minPrice);
    const maxPrice = Number(formData.maxPrice);
    const email = formData.loginEmail.trim().toLowerCase();

    if (!formData.aboutBusiness.trim()) {
      nextErrors.aboutBusiness = "Business information is required.";
    } else if (formData.aboutBusiness.trim().length < 25) {
      nextErrors.aboutBusiness =
        "Add at least 25 characters about the business.";
    }

    if (!formData.experience) {
      nextErrors.experience = "Select years of experience.";
    }

    if (selectedServices.length === 0) {
      nextErrors.services = "Select at least one service.";
    }

    if (formData.minPrice === "" || Number.isNaN(minPrice) || minPrice < 0) {
      nextErrors.minPrice = "Enter a valid minimum price.";
    }

    if (formData.maxPrice === "" || Number.isNaN(maxPrice) || maxPrice < 0) {
      nextErrors.maxPrice = "Enter a valid maximum price.";
    }

    if (
      !Number.isNaN(minPrice) &&
      !Number.isNaN(maxPrice) &&
      maxPrice < minPrice
    ) {
      nextErrors.maxPrice = "Maximum price cannot be below minimum price.";
    }

    if (!formData.openingTime) {
      nextErrors.openingTime = "Opening time is required.";
    }

    if (!formData.closingTime) {
      nextErrors.closingTime = "Closing time is required.";
    }

    if (
      formData.openingTime &&
      formData.closingTime &&
      formData.openingTime === formData.closingTime
    ) {
      nextErrors.closingTime =
        "Opening and closing times cannot be the same.";
    }

    if (!email) {
      nextErrors.loginEmail = "Login email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.loginEmail = "Enter a valid login email.";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters.";
    } else if (
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password) ||
      !/\d/.test(formData.password)
    ) {
      nextErrors.password = "Include uppercase, lowercase, and a number.";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveForLater = () => {
    const draft = {
      aboutBusiness: formData.aboutBusiness,
      experience: formData.experience,
      minPrice: formData.minPrice,
      maxPrice: formData.maxPrice,
      openingTime: formData.openingTime,
      closingTime: formData.closingTime,
      loginEmail: formData.loginEmail,
      services: selectedServices,
    };

    sessionStorage.setItem(
      "vendorRegistrationStep3",
      JSON.stringify(draft)
    );

    setDraftNotice("Draft saved. Logo and passwords were not stored.");
    window.setTimeout(() => setDraftNotice(""), 3500);
  };

  const handleBack = () => {
    handleSaveForLater();

    navigate("/vendorRegistrationPage2", {
      state: { step1Data, step2Data },
    });
  };

  const handleCompleteRegistration = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    setSubmitError("");

    if (!step1Data || !step2Data) {
      setSubmitError(
        "Previous registration details are missing. Please start again."
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setSubmitError(
        "No login session was found. Please log in before completing vendor registration."
      );
      return;
    }

    const categoryValue = step1Data.categoryId || step1Data.category || "";

    if (!categoryValue) {
      setSubmitError(
        "The selected category is missing. Please return to Step 1."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = new FormData();
      requestData.append(
        "businessName",
        String(step1Data.businessName || "").trim()
      );
      requestData.append(
        "ownerName",
        String(step1Data.ownerName || "").trim()
      );
      requestData.append(
        "mobileNumber",
        String(step1Data.mobileNumber || "").replace(/\D/g, "")
      );
      requestData.append("category", String(categoryValue));
      requestData.append(
        "postalCode",
        String(step1Data.location || step1Data.postalCode || "").trim()
      );
      requestData.append(
        "whatsapp",
        String(step2Data.whatsapp || step2Data.whatsappNumber || "").replace(
          /\D/g,
          ""
        )
      );
      requestData.append(
        "email",
        formData.loginEmail.trim().toLowerCase()
      );
      requestData.append(
        "address",
        String(step2Data.address || step2Data.streetAddress || "").trim()
      );
      requestData.append("city", String(step2Data.city || "").trim());
      requestData.append("state", String(step2Data.state || "").trim());
      requestData.append(
        "landmark",
        String(step2Data.landmark || "").trim()
      );
      requestData.append("aboutBusiness", formData.aboutBusiness.trim());
      requestData.append("experience", formData.experience);
      requestData.append("minPrice", formData.minPrice);
      requestData.append("maxPrice", formData.maxPrice);
      requestData.append("openingTime", formData.openingTime);
      requestData.append("closingTime", formData.closingTime);
      requestData.append("password", formData.password);
      requestData.append("confirmPassword", formData.confirmPassword);
      requestData.append(
        "services",
        JSON.stringify(selectedServices.map((name) => ({ name })))
      );

      if (formData.logo instanceof File) {
        requestData.append("logo", formData.logo, formData.logo.name);
      }

      const response = await fetch(`${API_URL}/api/vendor-registrations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: requestData,
      });

      const contentType = response.headers.get("content-type") || "";
      const responseText = await response.text();
      let result = {};

      if (responseText && contentType.includes("application/json")) {
        try {
          result = JSON.parse(responseText);
        } catch {
          result = {
            success: false,
            message: "The backend returned invalid JSON.",
          };
        }
      } else if (responseText) {
        result = { success: false, message: responseText };
      }

      if (!response.ok) {
        if (result.errors && typeof result.errors === "object") {
          const mappedErrors = { ...result.errors };

          if (mappedErrors.email) {
            mappedErrors.loginEmail = mappedErrors.email;
            delete mappedErrors.email;
          }

          setErrors((currentErrors) => ({
            ...currentErrors,
            ...mappedErrors,
          }));
        }

        const validationSummary = result.errors
          ? Object.values(result.errors)
              .filter((message) => typeof message === "string")
              .join(" ")
          : "";

        throw new Error(
          validationSummary ||
            result.message ||
            `Registration failed with status ${response.status}.`
        );
      }

      if (!result?.data?.vendorId) {
        throw new Error(
          "Registration succeeded, but the server did not return a vendor ID."
        );
      }

      sessionStorage.removeItem("vendorRegistrationStep1");
      sessionStorage.removeItem("vendorRegistrationStep2");
      sessionStorage.removeItem("vendorRegistrationStep3");
      localStorage.removeItem("vendorRegistrationDraft");

      navigate("/vendorRegistrationSuccess", {
        replace: true,
        state: {
          vendorId: result.data.vendorId,
          email: result.data.accountEmail,
          registrationStatus: result.data.registrationStatus,
        },
      });
    } catch (requestError) {
      console.error("Vendor registration error:", requestError);
      setSubmitError(
        requestError instanceof TypeError
          ? "Could not connect to the backend. Confirm that the backend is running."
          : requestError.message ||
              "Vendor registration could not be completed."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vendor-step3-page">
      <div className="vendor-step3-container">
        <header className="vendor-step3-header">
          <button
            type="button"
            className="vendor-step3-back"
            onClick={handleBack}
            aria-label="Return to contact and location"
          >
            <FiArrowLeft />
          </button>

          <div className="vendor-step3-brand">
            <img src={logo} alt="Milieu Global" />
            <span>Vendor Registration</span>
          </div>

          <span className="vendor-step3-header-spacer" />
        </header>

        <main className="vendor-step3-content">
          <section className="vendor-step3-hero">
            <div className="vendor-step3-decoration" />
            <span className="vendor-step3-hero-icon">
              <FiBriefcase />
            </span>
            <small>FINAL REGISTRATION STEP</small>
            <h1>Complete your vendor profile</h1>
            <p>
              Add services, pricing, operating hours, and secure login
              credentials for the vendor dashboard.
            </p>

            <div className="vendor-step3-progress-card">
              <div className="vendor-step3-progress-title">
                <span>Step 3 of 3</span>
                <strong>Business details</strong>
              </div>

              <div
                className="vendor-step3-progress-track"
                role="progressbar"
                aria-valuemin="1"
                aria-valuemax="3"
                aria-valuenow="3"
                aria-label="Step 3 of 3"
              >
                <span className="vendor-step3-progress-fill" />
              </div>

              <div className="vendor-step3-progress-steps" aria-hidden="true">
                <span className="complete">
                  <FiCheck />
                </span>
                <span className="complete">
                  <FiCheck />
                </span>
                <span className="active">3</span>
              </div>
            </div>
          </section>

          <div className="vendor-step3-summary">
            <span className="vendor-step3-summary-icon">
              <FaStore />
            </span>
            <div>
              <small>FINALIZING</small>
              <strong>{step1Data?.businessName || "Vendor profile"}</strong>
              <p>
                {step1Data?.categoryName || "Service provider"}
                {step2Data?.city ? ` · ${step2Data.city}` : ""}
              </p>
            </div>
            <span className="vendor-step3-completion">
              {completedSectionCount}/4
            </span>
          </div>

          {draftNotice && (
            <div className="vendor-step3-draft-notice" role="status">
              <FiSave />
              <span>{draftNotice}</span>
            </div>
          )}

          <form
            className="vendor-step3-form"
            onSubmit={handleCompleteRegistration}
            noValidate
          >
            <section className="vendor-step3-form-card">
              <div className="vendor-step3-section-heading">
                <span className="vendor-step3-section-icon">
                  <FiImage />
                </span>
                <div>
                  <small>PROFILE PRESENTATION</small>
                  <h2>Business profile</h2>
                </div>
              </div>

              <div className="vendor-step3-group">
                <div className="vendor-step3-label-row">
                  <label>Business logo</label>
                  <span>Optional · JPG or PNG · 5 MB max</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) processFile(file);
                  }}
                  className="vendor-step3-hidden-input"
                />

                <div
                  className={`vendor-step3-upload ${
                    isDragging ? "dragging" : ""
                  } ${logoPreview ? "has-preview" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) processFile(file);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  {logoPreview ? (
                    <div className="vendor-step3-preview-wrap">
                      <img src={logoPreview} alt="Business logo preview" />
                      <div className="vendor-step3-preview-actions">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          <FiUploadCloud /> Replace
                        </button>
                        <button type="button" onClick={removeLogo}>
                          <FiTrash2 /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="vendor-step3-upload-icon">
                        <FiUploadCloud />
                      </span>
                      <strong>Upload the business logo</strong>
                      <p>Drag and drop a file, or tap to browse.</p>
                    </>
                  )}
                </div>

                {errors.logo && (
                  <span className="vendor-step3-error" role="alert">
                    {errors.logo}
                  </span>
                )}
              </div>

              <div className="vendor-step3-group vendor-step3-last-group">
                <div className="vendor-step3-label-row">
                  <label htmlFor="aboutBusiness">About the business</label>
                  <span>{formData.aboutBusiness.length}/600</span>
                </div>
                <textarea
                  id="aboutBusiness"
                  name="aboutBusiness"
                  value={formData.aboutBusiness}
                  onChange={handleChange}
                  rows={5}
                  maxLength={600}
                  placeholder="Describe the business, expertise, and what makes the service unique..."
                  className={errors.aboutBusiness ? "invalid" : ""}
                />
                {errors.aboutBusiness && (
                  <span className="vendor-step3-error" role="alert">
                    {errors.aboutBusiness}
                  </span>
                )}
              </div>
            </section>

            <section className="vendor-step3-form-card">
              <div className="vendor-step3-section-heading">
                <span className="vendor-step3-section-icon services">
                  <FiBriefcase />
                </span>
                <div>
                  <small>SERVICES AND EXPERIENCE</small>
                  <h2>What the business offers</h2>
                </div>
              </div>

              <div className="vendor-step3-group">
                <label htmlFor="experience">Years of experience</label>
                <div
                  className={`vendor-step3-select-shell ${
                    errors.experience ? "invalid" : ""
                  }`}
                >
                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                  >
                    <option value="">Select experience</option>
                    <option value="less-than-1">Less than 1 year</option>
                    <option value="1-3">1 to 3 years</option>
                    <option value="3-5">3 to 5 years</option>
                    <option value="5-10">5 to 10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
                {errors.experience && (
                  <span className="vendor-step3-error" role="alert">
                    {errors.experience}
                  </span>
                )}
              </div>

              <div className="vendor-step3-group vendor-step3-last-group">
                <div className="vendor-step3-label-row">
                  <label>Services offered</label>
                  <span>{selectedServices.length} selected</span>
                </div>

                <div className="vendor-step3-services">
                  {DEFAULT_SERVICES.map((service) => (
                    <button
                      type="button"
                      key={service}
                      className={`vendor-step3-service-chip ${
                        selectedServices.includes(service) ? "selected" : ""
                      }`}
                      onClick={() => toggleService(service)}
                    >
                      {selectedServices.includes(service) && <FiCheck />}
                      {service}
                    </button>
                  ))}

                  {selectedServices
                    .filter((service) => !DEFAULT_SERVICES.includes(service))
                    .map((service) => (
                      <button
                        type="button"
                        key={service}
                        className="vendor-step3-service-chip selected custom"
                        onClick={() => toggleService(service)}
                      >
                        <FiX /> {service}
                      </button>
                    ))}
                </div>

                <div className="vendor-step3-custom-service">
                  <input
                    type="text"
                    value={customService}
                    onChange={(event) => setCustomService(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustomService();
                      }
                    }}
                    placeholder="Add another service"
                    maxLength={45}
                  />
                  <button type="button" onClick={addCustomService}>
                    <FiPlus /> Add
                  </button>
                </div>

                {errors.services && (
                  <span className="vendor-step3-error" role="alert">
                    {errors.services}
                  </span>
                )}
              </div>
            </section>

            <section className="vendor-step3-form-card">
              <div className="vendor-step3-section-heading">
                <span className="vendor-step3-section-icon pricing">
                  <FiDollarSign />
                </span>
                <div>
                  <small>PRICING AND AVAILABILITY</small>
                  <h2>Pricing and business hours</h2>
                </div>
              </div>

              <div className="vendor-step3-field-grid">
                <div className="vendor-step3-group">
                  <label htmlFor="minPrice">Minimum price</label>
                  <div
                    className={`vendor-step3-price-shell ${
                      errors.minPrice ? "invalid" : ""
                    }`}
                  >
                    <span>₹</span>
                    <input
                      id="minPrice"
                      name="minPrice"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.minPrice}
                      onChange={handleChange}
                      placeholder="500"
                    />
                  </div>
                  {errors.minPrice && (
                    <span className="vendor-step3-error" role="alert">
                      {errors.minPrice}
                    </span>
                  )}
                </div>

                <div className="vendor-step3-group">
                  <label htmlFor="maxPrice">Maximum price</label>
                  <div
                    className={`vendor-step3-price-shell ${
                      errors.maxPrice ? "invalid" : ""
                    }`}
                  >
                    <span>₹</span>
                    <input
                      id="maxPrice"
                      name="maxPrice"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.maxPrice}
                      onChange={handleChange}
                      placeholder="5000"
                    />
                  </div>
                  {errors.maxPrice && (
                    <span className="vendor-step3-error" role="alert">
                      {errors.maxPrice}
                    </span>
                  )}
                </div>
              </div>

              <div className="vendor-step3-field-grid business-hours">
                <div className="vendor-step3-group vendor-step3-last-group">
                  <label htmlFor="openingTime">Opening time</label>
                  <div
                    className={`vendor-step3-time-shell ${
                      errors.openingTime ? "invalid" : ""
                    }`}
                  >
                    <FiClock />
                    <input
                      id="openingTime"
                      name="openingTime"
                      type="time"
                      value={formData.openingTime}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.openingTime && (
                    <span className="vendor-step3-error" role="alert">
                      {errors.openingTime}
                    </span>
                  )}
                </div>

                <div className="vendor-step3-group vendor-step3-last-group">
                  <label htmlFor="closingTime">Closing time</label>
                  <div
                    className={`vendor-step3-time-shell ${
                      errors.closingTime ? "invalid" : ""
                    }`}
                  >
                    <FiClock />
                    <input
                      id="closingTime"
                      name="closingTime"
                      type="time"
                      value={formData.closingTime}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.closingTime && (
                    <span className="vendor-step3-error" role="alert">
                      {errors.closingTime}
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="vendor-step3-form-card">
              <div className="vendor-step3-section-heading">
                <span className="vendor-step3-section-icon security">
                  <FiLock />
                </span>
                <div>
                  <small>SECURE VENDOR ACCESS</small>
                  <h2>Vendor panel login</h2>
                </div>
              </div>

              <div className="vendor-step3-group">
                <label htmlFor="loginEmail">Login email</label>
                <div
                  className={`vendor-step3-input-shell ${
                    errors.loginEmail ? "invalid" : ""
                  }`}
                >
                  <FiMail />
                  <input
                    id="loginEmail"
                    name="loginEmail"
                    type="email"
                    value={formData.loginEmail}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder="vendor@example.com"
                  />
                </div>
                <p className="vendor-step3-field-help">
                  This address will be used to sign in to the vendor panel.
                </p>
                {errors.loginEmail && (
                  <span className="vendor-step3-error" role="alert">
                    {errors.loginEmail}
                  </span>
                )}
              </div>

              <div className="vendor-step3-group">
                <label htmlFor="password">Password</label>
                <div
                  className={`vendor-step3-input-shell ${
                    errors.password ? "invalid" : ""
                  }`}
                >
                  <FiLock />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    className="vendor-step3-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                <p className="vendor-step3-field-help">
                  Include uppercase, lowercase, and at least one number.
                </p>
                {errors.password && (
                  <span className="vendor-step3-error" role="alert">
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="vendor-step3-group vendor-step3-last-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <div
                  className={`vendor-step3-input-shell ${
                    errors.confirmPassword ? "invalid" : ""
                  }`}
                >
                  <FiLock />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder="Re-enter the password"
                  />
                  <button
                    type="button"
                    className="vendor-step3-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirmed password"
                        : "Show confirmed password"
                    }
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="vendor-step3-error" role="alert">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </section>

            <div className="vendor-step3-note">
              <FiCheck />
              <span>
                By completing registration, the vendor information will be
                submitted for review before publication.
              </span>
            </div>

            {submitError && (
              <div className="vendor-step3-submit-error" role="alert">
                {submitError}
              </div>
            )}

            <div className="vendor-step3-actions">
              <button
                type="button"
                className="vendor-step3-save"
                onClick={handleSaveForLater}
                disabled={isSubmitting}
              >
                <FiSave /> Save draft
              </button>

              <button
                type="submit"
                className="vendor-step3-complete"
                disabled={isSubmitting}
              >
                <span>
                  {isSubmitting ? "Creating vendor account..." : "Complete registration"}
                </span>
                {!isSubmitting && <FiArrowRight />}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
