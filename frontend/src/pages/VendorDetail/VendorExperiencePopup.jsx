import React, { useEffect, useRef, useState } from "react";
import { FiCheck, FiStar, FiX } from "react-icons/fi";
import "./VendorExperiencePopup.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const getToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

export default function VendorExperiencePopup({
  vendorId,
  vendorName,
  open,
  onClose,
}) {
  const [step, setStep] = useState("confirm");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const busyRef = useRef(busy);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const dismiss = (reason = "later") => {
    if (busyRef.current) return;
    onCloseRef.current(reason);
  };

  useEffect(() => {
    if (!open) return undefined;

    setStep("confirm");
    setRating(0);
    setReviewText("");
    setError("");

    const escape = (event) => {
      if (event.key === "Escape" && !busyRef.current) {
        dismiss("later");
      }
    };

    document.addEventListener("keydown", escape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", escape);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    if (!rating) {
      return setError("Please select a rating.");
    }

    const token = getToken();

    if (!token) {
      return setError(
        "Please log in again before submitting feedback."
      );
    }

    try {
      setBusy(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/vendor-directory/${vendorId}/experience-feedback`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookedWithProvider: true,
            rating,
            reviewText: reviewText.trim(),
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Feedback could not be submitted."
        );
      }

      setStep("success");
    } catch (requestError) {
      setError(
        requestError.message ||
          "Feedback could not be submitted."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="vep-backdrop" onMouseDown={() => dismiss("later")}>
      <section
        className="vep-dialog"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {step !== "success" && (
          <button
            className="vep-close"
            type="button"
            onClick={() => dismiss("later")}
          >
            <FiX />
          </button>
        )}

        {step === "confirm" && (
          <>
            <h2>Booking Confirmation</h2>

            <p>
              Did you book with{" "}
              {vendorName || "this service provider"}?
            </p>

            <div className="vep-actions">
              <button type="button" onClick={() => dismiss("not-booked")}>
                No
              </button>

              <button
                className="primary"
                type="button"
                onClick={() => setStep("rating")}
              >
                Yes
              </button>
            </div>
          </>
        )}

        {step === "rating" && (
          <>
            <h2>How was your experience?</h2>

            <p>
              Your feedback helps us improve our services.
            </p>

            <div className="vep-stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={
                    value <= rating ? "selected" : ""
                  }
                  onClick={() => setRating(value)}
                  aria-label={`${value} stars`}
                >
                  <FiStar />
                </button>
              ))}
            </div>

            <textarea
              className="vep-review-text"
              value={reviewText}
              onChange={(event) =>
                setReviewText(event.target.value)
              }
              placeholder="Tell us about your experience..."
              rows={4}
              maxLength={1000}
            />

            <div className="vep-character-count">
              {reviewText.length}/1000
            </div>

            {error && (
              <p className="vep-error">
                {error}
              </p>
            )}

            <button
              className="vep-submit"
              type="button"
              disabled={busy || !rating}
              onClick={submit}
            >
              {busy ? "Submitting..." : "Submit"}
            </button>

            <button
              className="vep-later"
              type="button"
              onClick={() => dismiss("later")}
            >
              Maybe Later
            </button>
          </>
        )}

        {step === "success" && (
          <>
            <span className="vep-success">
              <FiCheck />
            </span>

            <h2>Thank you!</h2>

            <p>Thank you for your feedback!</p>

            <button
              className="vep-submit"
              type="button"
              onClick={() => onClose("submitted")}
            >
              Dismiss
            </button>
          </>
        )}
      </section>
    </div>
  );
}