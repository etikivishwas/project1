import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiHeart,
  FiMapPin,
  FiStar,
} from "react-icons/fi";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const getStoredToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("accessToken") ||
  sessionStorage.getItem("token") ||
  "";

export default function SavedProviders() {
  const navigate = useNavigate();

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSavedProviders = async () => {
      const token = getStoredToken();

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/user/saved-providers`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load saved providers."
          );
        }

        setProviders(
          Array.isArray(result.data) ? result.data : []
        );
      } catch (requestError) {
        console.error(
          "Failed to fetch saved providers:",
          requestError
        );

        setError(
          requestError.message ||
            "Unable to load saved providers."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSavedProviders();
  }, [navigate]);

  const removeSavedProvider = async (vendorId) => {
    const token = getStoredToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/user/saved-providers/${vendorId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to remove provider."
        );
      }

      setProviders((current) =>
        current.filter(
          (provider) => Number(provider.id) !== Number(vendorId)
        )
      );
    } catch (requestError) {
      console.error(
        "Remove saved provider error:",
        requestError
      );
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        paddingBottom: "30px",
      }}
    >
      <header
        style={{
          height: "72px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "0 18px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e9ef",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/userProfile")}
          style={{
            width: "38px",
            height: "38px",
            display: "grid",
            placeItems: "center",
            border: 0,
            borderRadius: "50%",
            background: "#f1f3f6",
            cursor: "pointer",
          }}
          aria-label="Back to profile"
        >
          <FiArrowLeft size={19} />
        </button>

        <h1
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: 700,
            color: "#111827",
          }}
        >
          Saved Providers
        </h1>
      </header>

      <main style={{ padding: "20px 18px" }}>
        {loading && (
          <div
            style={{
              padding: "50px 20px",
              textAlign: "center",
              color: "#687280",
            }}
          >
            Loading saved providers...
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: "30px 20px",
              textAlign: "center",
              color: "#687280",
            }}
          >
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && providers.length === 0 && (
          <div
            style={{
              padding: "55px 20px",
              textAlign: "center",
              background: "#ffffff",
              border: "1px solid #e5e9ef",
              borderRadius: "14px",
            }}
          >
            <FiHeart
              size={34}
              style={{
                color: "#9aa3ad",
                marginBottom: "12px",
              }}
            />

            <h2
              style={{
                margin: "0 0 6px",
                fontSize: "16px",
                color: "#182230",
              }}
            >
              No saved providers
            </h2>

            <p
              style={{
                margin: 0,
                color: "#687280",
                fontSize: "12px",
              }}
            >
              Providers you save will appear here.
            </p>
          </div>
        )}

        {!loading && !error && providers.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            {providers.map((provider) => {
              const imageUrl =
                provider.image_url ||
                (provider.id
                  ? `${API_URL}/api/images/vendors/${provider.id}/main`
                  : "");

              return (
                <article
                  key={provider.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "12px",
                    background: "#ffffff",
                    border: "1px solid #e5e9ef",
                    borderRadius: "13px",
                    boxShadow:
                      "0 5px 15px rgba(15, 32, 48, 0.05)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/vendor/${provider.id}`)
                    }
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      gap: "12px",
                      padding: 0,
                      textAlign: "left",
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={provider.name || "Provider"}
                        style={{
                          width: "82px",
                          height: "82px",
                          flexShrink: 0,
                          objectFit: "cover",
                          borderRadius: "10px",
                          background: "#e9edf2",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "82px",
                          height: "82px",
                          flexShrink: 0,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: "10px",
                          background: "#e9edf2",
                          fontSize: "24px",
                          fontWeight: 800,
                          color: "#183147",
                        }}
                      >
                        {provider.name?.charAt(0)?.toUpperCase() ||
                          "P"}
                      </div>
                    )}

                    <div
                      style={{
                        minWidth: 0,
                        paddingTop: "2px",
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          overflow: "hidden",
                          color: "#16202d",
                          fontSize: "14px",
                          fontWeight: 700,
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {provider.name || "Provider"}
                      </h2>

                      {provider.service_type && (
                        <p
                          style={{
                            margin: "6px 0 0",
                            color: "#687280",
                            fontSize: "11px",
                          }}
                        >
                          {provider.service_type}
                        </p>
                      )}

                      {provider.rating !== undefined && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            marginTop: "7px",
                            color: "#444d58",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          <FiStar
                            size={11}
                            fill="#f2bb3a"
                            color="#f2bb3a"
                          />
                          {provider.rating || "0.0"}
                        </span>
                      )}

                      {(provider.city || provider.address) && (
                        <p
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            margin: "5px 0 0",
                            overflow: "hidden",
                            color: "#7a838d",
                            fontSize: "10px",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <FiMapPin size={10} />
                          {provider.city || provider.address}
                        </p>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      removeSavedProvider(provider.id)
                    }
                    aria-label="Remove saved provider"
                    style={{
                      width: "36px",
                      height: "36px",
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      color: "#e53935",
                      background: "#fff1f1",
                      border: 0,
                      borderRadius: "50%",
                      cursor: "pointer",
                    }}
                  >
                    <FiHeart
                      size={18}
                      fill="currentColor"
                    />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}