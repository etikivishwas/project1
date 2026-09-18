import React from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./VendorRegistrationSuccess.css";

const VendorRegistrationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const vendorId = location.state?.vendorId;
  const email = location.state?.email;
  const registrationStatus =
    location.state?.registrationStatus;

  /*
    Prevent direct access when registration
    response data is missing.
  */
  if (!vendorId) {
    return (
      <Navigate
        to="/userProfile"
        replace
      />
    );
  }

  return (
    <div className="vendor-success-page">
      <div className="vendor-success-card">
        <div className="vendor-success-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <h1>Registration Submitted</h1>

        <p className="vendor-success-message">
          Your vendor registration and vendor-panel
          account were created successfully.
        </p>

        <div className="vendor-success-details">
          <div className="vendor-success-row">
            <span>Vendor ID</span>
            <strong>{vendorId}</strong>
          </div>

          <div className="vendor-success-row">
            <span>Login Email</span>
            <strong>{email}</strong>
          </div>

          <div className="vendor-success-row">
            <span>Status</span>
            <strong className="vendor-status">
              {registrationStatus || "submitted"}
            </strong>
          </div>
        </div>

        <p className="vendor-review-note">
          Your business is currently under review.
          You can use the registered email and password
          to log in to the vendor panel.
        </p>

        <button
          type="button"
          className="vendor-panel-login-button"
          onClick={() =>
            navigate("/vendor-panel/login", {
              replace: true,
            })
          }
        >
          Go to Vendor Panel Login
        </button>

        <button
          type="button"
          className="vendor-profile-button"
          onClick={() =>
            navigate("/userProfile", {
              replace: true,
            })
          }
        >
          Return to User Profile
        </button>
      </div>
    </div>
  );
};

export default VendorRegistrationSuccess;