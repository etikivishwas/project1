import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiImage,
  FiInfo,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiRefreshCw,
  FiShare2,
  FiShield,
  FiStar,
  FiX,
} from "react-icons/fi";
import VendorExperiencePopup from "./VendorExperiencePopup";
import "./VendorDetails.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const getImageUrl = (imagePath) => {
  if (typeof imagePath !== "string" || !imagePath.trim()) {
    return null;
  }

  const normalizedPath = imagePath.trim();

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://") ||
    normalizedPath.startsWith("blob:") ||
    normalizedPath.startsWith("data:")
  ) {
    return normalizedPath;
  }

  return `${API_URL}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
};

const readAccessToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

const readResponseData = async (response) => {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return {
      success: false,
      message: "The server returned an invalid response.",
    };
  }
};

const getVendorInitial = (vendorName) => {
  if (typeof vendorName !== "string" || !vendorName.trim()) {
    return "V";
  }

  return vendorName.trim().charAt(0).toUpperCase();
};

const getTodayValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function VendorDetails() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const vendorPreview = location.state?.vendorPreview || null;

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [failedGalleryImages, setFailedGalleryImages] = useState({});
  const [bookingOpen, setBookingOpen] = useState(false);
  const [experiencePopupOpen, setExperiencePopupOpen] = useState(false);
  const [booking, setBooking] = useState({
    vendorServiceId: "",
    serviceDate: "",
    notes: "",
  });
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadVendor = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setHeroImageFailed(false);
      setFailedGalleryImages({});

      const response = await fetch(
        `${API_URL}/api/vendor-directory/${vendorId}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      const result = await readResponseData(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Vendor could not be loaded. Server returned status ${response.status}.`
        );
      }

      if (!result.data) {
        throw new Error("The response did not contain vendor details.");
      }

      const normalizedVendor = {
        ...result.data,
        imageUrl:
          result.data.imageUrl ??
          result.data.image_url ??
          vendorPreview?.imageUrl ??
          vendorPreview?.image_url ??
          (result.data.id || vendorId
            ? `/api/images/vendors/${result.data.id || vendorId}/main`
            : null),
        serviceType:
          result.data.serviceType ??
          result.data.service_type ??
          result.data.categoryName ??
          vendorPreview?.serviceType ??
          vendorPreview?.service_type ??
          "Local services",
        isVerified: Boolean(
          result.data.isVerified ??
            result.data.is_verified ??
            vendorPreview?.isVerified ??
            vendorPreview?.is_verified
        ),
        isPremium: Boolean(
          result.data.isPremium ??
            result.data.is_premium ??
            vendorPreview?.isPremium ??
            vendorPreview?.is_premium
        ),
      };

      setVendor(normalizedVendor);
    } catch (requestError) {
      console.error("Vendor details error:", requestError);
      setError(requestError.message || "Vendor details could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [vendorId, vendorPreview]);

  useEffect(() => {
    loadVendor();
  }, [loadVendor]);

  useEffect(() => {
    setHeroImageFailed(false);
  }, [vendor?.imageUrl]);

  useEffect(() => {
    const resolvedVendorId = vendor?.id || vendorId;

    if (!resolvedVendorId || loading || error) {
      return undefined;
    }

    const storageKey = `vendor-experience-popup:${resolvedVendorId}`;
    const alreadySubmitted =
      localStorage.getItem(storageKey) === "submitted";
    const alreadyHandledThisSession = Boolean(
      sessionStorage.getItem(storageKey)
    );

    if (alreadySubmitted || alreadyHandledThisSession) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setExperiencePopupOpen(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [vendor?.id, vendorId, loading, error]);

  useEffect(() => {
    if (!bookingOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setBookingOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [bookingOpen]);

  const vendorServices = useMemo(
    () => (Array.isArray(vendor?.services) ? vendor.services : []),
    [vendor]
  );

  const bookableServices = useMemo(
    () =>
      vendorServices.filter((service) => {
        const numericServiceId = Number(service.id);
        return (
          Number.isInteger(numericServiceId) &&
          numericServiceId > 0 &&
          !service.synthetic
        );
      }),
    [vendorServices]
  );

  const selectedService = useMemo(
    () =>
      bookableServices.find(
        (service) => String(service.id) === String(booking.vendorServiceId)
      ),
    [bookableServices, booking.vendorServiceId]
  );

  const heroImageUrl = useMemo(
    () => getImageUrl(vendor?.imageUrl),
    [vendor?.imageUrl]
  );

  const gallery = useMemo(() => {
    if (!Array.isArray(vendor?.gallery)) {
      return [];
    }

    const uniqueImages = new Map();

    vendor.gallery.forEach((galleryItem) => {
      const completeImageUrl = getImageUrl(
        galleryItem?.imageUrl ?? galleryItem?.image_url
      );

      if (!completeImageUrl) {
        return;
      }

      const key = String(galleryItem.id || completeImageUrl);

      uniqueImages.set(key, {
        id: key,
        imageUrl: completeImageUrl,
        caption: galleryItem.caption || "",
      });
    });

    return Array.from(uniqueImages.values()).slice(0, 4);
  }, [vendor?.gallery]);

  const vendorInitial = useMemo(
    () => getVendorInitial(vendor?.name),
    [vendor?.name]
  );

  const minimumBookingDate = useMemo(() => getTodayValue(), []);

  const openBooking = (serviceId = "") => {
    setBooking((currentBooking) => ({
      ...currentBooking,
      vendorServiceId: serviceId
        ? String(serviceId)
        : currentBooking.vendorServiceId,
    }));
    setBookingError("");
    setBookingSuccess("");
    setBookingOpen(true);
  };

  const closeBooking = () => {
    if (submitting) {
      return;
    }

    setBookingOpen(false);
    setBookingError("");
    setBookingSuccess("");
  };

  const handleBookingChange = (event) => {
    const { name, value } = event.target;

    setBooking((currentBooking) => ({
      ...currentBooking,
      [name]: value,
    }));

    setBookingError("");
    setBookingSuccess("");
  };

  const submitBooking = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setBookingError("");
    setBookingSuccess("");

    if (!booking.vendorServiceId) {
      setBookingError("Please select a service.");
      return;
    }

    if (!booking.serviceDate) {
      setBookingError("Please select a service date.");
      return;
    }

    if (booking.serviceDate < minimumBookingDate) {
      setBookingError("The service date cannot be in the past.");
      return;
    }

    const accessToken = readAccessToken();

    if (!accessToken) {
      setBookingError("Please log in to book this service.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/api/vendor-directory/${vendorId}/bookings`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            vendorServiceId: Number(booking.vendorServiceId),
            serviceDate: booking.serviceDate,
            notes: booking.notes.trim(),
          }),
        }
      );

      const result = await readResponseData(response);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || `Booking failed with status ${response.status}.`
        );
      }

      setBookingSuccess(
        result.message || "Booking request sent successfully."
      );
      setBooking({ vendorServiceId: "", serviceDate: "", notes: "" });
    } catch (requestError) {
      console.error("Booking request error:", requestError);
      setBookingError(requestError.message || "Booking could not be created.");
    } finally {
      setSubmitting(false);
    }
  };

  const callVendor = () => {
    const phoneNumber = String(vendor?.phone || "").trim();

    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  const whatsappVendor = () => {
    const normalizedNumber = String(
      vendor?.whatsapp || vendor?.phone || ""
    ).replace(/\D/g, "");

    if (!normalizedNumber) {
      return;
    }

    const internationalNumber =
      normalizedNumber.length === 10
        ? `91${normalizedNumber}`
        : normalizedNumber;

    window.open(
      `https://wa.me/${internationalNumber}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const shareVendor = async () => {
    const shareData = {
      title: vendor?.name || "Tezo Bizz vendor",
      text: `View ${vendor?.name || "this provider"} on Tezo Bizz`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        console.error("Share provider error:", shareError);
      }
    }
  };

  const markGalleryImageFailed = (imageId) => {
    setFailedGalleryImages((currentValues) => ({
      ...currentValues,
      [imageId]: true,
    }));
  };

  if (loading) {
    return (
      <div className="vd-state">
        <div className="vd-loader" aria-hidden="true" />
        <p>Loading provider profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vd-state">
        <FiRefreshCw />
        <h2>Unable to load provider</h2>
        <p>{error}</p>
        <button type="button" onClick={loadVendor}>
          Try again
        </button>
      </div>
    );
  }

  if (!vendor) {
    return null;
  }

  const hasPhone = Boolean(String(vendor.phone || "").trim());
  const hasWhatsApp = Boolean(
    String(vendor.whatsapp || vendor.phone || "").replace(/\D/g, "")
  );

  return (
    <div className="vd-page">
      <header className="vd-topbar">
        <button type="button" onClick={() => navigate(-1)} aria-label="Go back">
          <FiArrowLeft />
        </button>
        <strong>Tezo Bizz</strong>
        <button type="button" onClick={shareVendor} aria-label="Share provider">
          <FiShare2 />
        </button>
      </header>

      <main className="vd-content">
        <section className="vd-hero">
          {heroImageUrl && !heroImageFailed ? (
            <img
              key={heroImageUrl}
              className="vd-hero-image"
              src={heroImageUrl}
              alt={vendor.name}
              onLoad={() => setHeroImageFailed(false)}
              onError={() => setHeroImageFailed(true)}
            />
          ) : (
            <div className="vd-hero-placeholder" aria-hidden="true">
              <span>{vendorInitial}</span>
            </div>
          )}

          <div className="vd-hero-shade" aria-hidden="true" />

          <div className="vd-hero-content">
            <div className="vd-badges">
              {vendor.isVerified && (
                <span className="verified">
                  <FiCheckCircle /> Verified
                </span>
              )}
              {vendor.distanceLabel && (
                <span className="distance">{vendor.distanceLabel}</span>
              )}
            </div>

            <h1>{vendor.name}</h1>

            <div className="vd-rating-line">
              <FiStar />
              <strong>{Number(vendor.rating || 0).toFixed(1)}</strong>
              <span>({Number(vendor.reviewCount || 0)} reviews)</span>
            </div>
          </div>
        </section>

        <section className="vd-card vd-about">
          <div className="vd-card-heading">
            <FiInfo />
            <h2>About</h2>
          </div>
          <p>
            {vendor.description ||
              "Professional local services delivered with care, safety, and reliability."}
          </p>
        </section>

        <section className="vd-card">
          <div className="vd-card-heading">
            <FiBriefcase />
            <h2>Services &amp; Pricing</h2>
          </div>

          <div className="vd-services">
            {vendorServices.length > 0 ? (
              vendorServices.map((service, index) => {
                const numericId = Number(service.id);
                const isBookable =
                  Number.isInteger(numericId) &&
                  numericId > 0 &&
                  !service.synthetic;

                return (
                  <button
                    type="button"
                    className="vd-service"
                    key={service.id || `${service.name}-${index}`}
                    disabled={!isBookable}
                    onClick={() => isBookable && openBooking(service.id)}
                  >
                    <span className="vd-service-copy">
                      <strong>{service.name}</strong>
                      <small>
                        {service.description ||
                          "Professional service offered by this provider."}
                      </small>
                    </span>
                    <span className="vd-service-price">
                      {service.priceLabel || "Get quote"}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="vd-empty">
                No services are currently listed. Contact the provider for a custom quote.
              </p>
            )}
          </div>

          {bookableServices.length > 0 && (
            <p className="vd-service-hint">
              Select a service row to send a booking request.
            </p>
          )}
        </section>

        {gallery.length > 0 && (
          <section className="vd-card">
            <div className="vd-card-heading">
              <FiImage />
              <h2>Work Gallery</h2>
            </div>

            <div className="vd-gallery">
              {gallery.map((galleryItem, index) => {
                const imageFailed = failedGalleryImages[galleryItem.id];

                return (
                  <button
                    type="button"
                    key={galleryItem.id}
                    aria-label={galleryItem.caption || `Open work image ${index + 1}`}
                    onClick={() => {
                      if (!imageFailed) {
                        window.open(
                          galleryItem.imageUrl,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }
                    }}
                  >
                    {!imageFailed ? (
                      <img
                        src={galleryItem.imageUrl}
                        alt={galleryItem.caption || `${vendor.name} work ${index + 1}`}
                        loading="lazy"
                        onError={() => markGalleryImageFailed(galleryItem.id)}
                      />
                    ) : (
                      <span className="vd-gallery-placeholder">
                        <FiImage />
                        <small>Image unavailable</small>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="vd-card vd-info">
          <div className="vd-card-heading">
            <FiBriefcase />
            <h2>Business Info</h2>
          </div>

          <div className="vd-info-row">
            <FiClock />
            <div>
              <strong>Business Hours</strong>
              <span>{vendor.businessHours || "Contact provider for availability"}</span>
            </div>
          </div>

          <div className="vd-info-row">
            <FiMapPin />
            <div>
              <strong>Service Area</strong>
              <span>
                {vendor.fullAddress ||
                  vendor.city ||
                  "Service location available on request"}
              </span>
            </div>
          </div>

          <div className="vd-verification-card">
            <span className="vd-shield">
              <FiShield />
            </span>
            <div>
              <strong>
                {vendor.isVerified ? "Tezo Verified Provider" : "Verification Pending"}
              </strong>
              <small>
                {vendor.isVerified
                  ? "Identity, background, and business details verified"
                  : "Provider verification is currently in progress"}
              </small>
            </div>
          </div>
        </section>

        {Array.isArray(vendor.reviews) && vendor.reviews.length > 0 && (
          <section className="vd-card">
            <div className="vd-card-heading">
              <FiStar />
              <h2>Customer Reviews</h2>
            </div>

            <div className="vd-reviews">
              {vendor.reviews.map((review, index) => (
                <article key={review.id || index}>
                  <div>
                    <strong>{review.customerName || "Customer"}</strong>
                    <span>
                      <FiStar /> {Number(review.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  {review.reviewText && <p>{review.reviewText}</p>}
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="vd-actionbar">
        <button type="button" className="call" onClick={callVendor} disabled={!hasPhone}>
          <FiPhone />
          <span>Call Now</span>
        </button>

        <button
          type="button"
          className="whatsapp"
          onClick={whatsappVendor}
          disabled={!hasWhatsApp}
        >
          <FiMessageCircle />
          <span>WhatsApp</span>
        </button>
      </div>

      {bookingOpen && (
        <div className="vd-modal-backdrop" onMouseDown={closeBooking}>
          <section
            className="vd-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="vd-modal-head">
              <div>
                <small>REQUEST A SERVICE</small>
                <h2 id="booking-title">Book {vendor.name}</h2>
              </div>
              <button type="button" onClick={closeBooking} aria-label="Close booking form">
                <FiX />
              </button>
            </div>

            <form onSubmit={submitBooking} noValidate>
              <label htmlFor="vendorServiceId">
                Service
                <select
                  id="vendorServiceId"
                  name="vendorServiceId"
                  value={booking.vendorServiceId}
                  onChange={handleBookingChange}
                >
                  <option value="">Select a service</option>
                  {bookableServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.priceLabel || "Get quote"}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor="serviceDate">
                Preferred date
                <input
                  id="serviceDate"
                  name="serviceDate"
                  type="date"
                  min={minimumBookingDate}
                  value={booking.serviceDate}
                  onChange={handleBookingChange}
                />
              </label>

              <label htmlFor="bookingNotes">
                Notes
                <textarea
                  id="bookingNotes"
                  name="notes"
                  rows="3"
                  maxLength="500"
                  placeholder="Describe the work, preferred time, or important details"
                  value={booking.notes}
                  onChange={handleBookingChange}
                />
              </label>

              {selectedService && (
                <div className="vd-booking-summary">
                  <span>Selected service</span>
                  <strong>{selectedService.name}</strong>
                  <span>{selectedService.priceLabel || "Get quote"}</span>
                </div>
              )}

              {bookingError && (
                <p className="vd-form-error" role="alert">
                  {bookingError}
                </p>
              )}

              {bookingSuccess && (
                <p className="vd-form-success" role="status">
                  {bookingSuccess}
                </p>
              )}

              <button className="vd-confirm" type="submit" disabled={submitting}>
                {submitting ? "Sending request..." : "Confirm booking request"}
              </button>
            </form>
          </section>
        </div>
      )}

      <VendorExperiencePopup
        vendorId={vendor.id || vendorId}
        vendorName={vendor.name}
        open={experiencePopupOpen}
        onClose={() => setExperiencePopupOpen(false)}
      />
    </div>
  );
}
