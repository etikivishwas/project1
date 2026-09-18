import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiChevronDown,
  FiClock,
  FiHelpCircle,
  FiHome,
  FiMail,
  FiMessageCircle,
  FiPhone,
  FiSearch,
  FiX,
} from "react-icons/fi";
import logo from "../../assets/logo.jpeg";
import "./HelpSupport.css";

const faqs = [
  {
    id: 1,
    category: "Providers",
    question: "How do I check whether a service provider is verified?",
    answer:
      "Open the provider profile and look for the Verified badge. Before contacting a provider, review the available service details, ratings, location, pricing information, and completed profile information.",
  },
  {
    id: 2,
    category: "Support",
    question: "What should I do if I have an issue with a service request?",
    answer:
      "Open Service History, select the relevant interaction, and keep the provider and service details available. Contact support by phone, chat, or email and describe the issue. The support team can then review the available information.",
  },
  {
    id: 3,
    category: "Vendor",
    question: "How can a provider upgrade to a Featured Listing?",
    answer:
      "A registered vendor can open the appropriate vendor account section and select the Featured Listing option when available. Follow the displayed plan, payment, and confirmation steps to complete the upgrade.",
  },
  {
    id: 4,
    category: "Account",
    question: "How can I update my account details?",
    answer:
      "Open My Profile, choose Settings & Privacy, and update the available account fields. Some information may require verification before the changes become active.",
  },
  {
    id: 5,
    category: "History",
    question: "Where can I find my previous service interactions?",
    answer:
      "Use the History tab in the bottom navigation. The page lists available service interactions and lets you reopen the related provider details.",
  },
];

const contactActions = [
  {
    id: "call",
    title: "Direct Call",
    subtitle: "Mon to Fri, 9 AM to 6 PM",
    icon: FiPhone,
    className: "call",
  },
  {
    id: "chat",
    title: "Live Chat",
    subtitle: "Typical reply within 5 minutes",
    icon: FiMessageCircle,
    className: "chat",
  },
  {
    id: "email",
    title: "Email Support",
    subtitle: "support@milieuglobal.com",
    icon: FiMail,
    className: "email",
  },
];

const footerItems = [
  { label: "Home", path: "/userScreen", icon: FiHome },
  { label: "Search", path: "/vendorSearch", icon: FiSearch },
  { label: "History", path: "/userHistory", icon: FiClock },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [chatNotice, setChatNotice] = useState("");

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return faqs;
    }

    return faqs.filter((faq) =>
      [faq.category, faq.question, faq.answer]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [searchQuery]);

  const handleContact = (action) => {
    if (action === "call") {
      window.location.href = "tel:+919381423238";
      return;
    }

    if (action === "email") {
      window.location.href =
        "mailto:support@milieuglobal.com?subject=Milieu%20Global%20Support";
      return;
    }

    setChatNotice("Live chat will be available here soon.");
    window.setTimeout(() => setChatNotice(""), 3500);
  };

  const isFooterActive = (path) => {
    if (path === "/vendorSearch") {
      return location.pathname.startsWith("/vendorSearch");
    }

    if (path === "/userHistory") {
      return location.pathname.startsWith("/userHistory");
    }

    return location.pathname === path;
  };

  return (
    <>
      <div className="help-page">
        <header className="help-header">
          <button
            type="button"
            className="help-back-button"
            onClick={() => navigate("/userProfile")}
            aria-label="Return to profile"
          >
            <FiArrowLeft />
          </button>

          <div className="help-header-brand">
            <img src={logo} alt="Milieu Global" />
            <span>Help & Support</span>
          </div>

          <span className="help-header-spacer" />
        </header>

        <main className="help-content">
          <section className="help-hero">
            <div className="help-hero-decoration" />
            <span className="help-hero-icon">
              <FiHelpCircle />
            </span>
            <small>HOW CAN WE HELP?</small>
            <h1>Support when you need it</h1>
            <p>
              Search common questions or contact the support team using the
              available options below.
            </p>

            <div className="help-search-wrapper">
              <FiSearch className="help-search-icon" />
              <input
                type="search"
                className="help-search-input"
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoComplete="off"
              />

              {searchQuery && (
                <button
                  type="button"
                  className="help-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear help search"
                >
                  <FiX />
                </button>
              )}
            </div>
          </section>

          {chatNotice && (
            <div className="help-notice" role="status">
              <FiMessageCircle />
              <span>{chatNotice}</span>
            </div>
          )}

          <section className="help-section">
            <div className="help-section-heading">
              <div>
                <small>CONTACT OPTIONS</small>
                <h2>Contact the support team</h2>
              </div>
            </div>

            <div className="contact-grid">
              {contactActions.map(
                ({ id, title, subtitle, icon: Icon, className }, index) => (
                  <button
                    type="button"
                    className="contact-card"
                    key={id}
                    onClick={() => handleContact(id)}
                    style={{ "--contact-index": index }}
                  >
                    <span className={`contact-icon ${className}`}>
                      <Icon />
                    </span>
                    <span className="contact-copy">
                      <strong>{title}</strong>
                      <small>{subtitle}</small>
                    </span>
                    <span className="contact-arrow">›</span>
                  </button>
                )
              )}
            </div>
          </section>

          <section className="help-section faq-section">
            <div className="help-section-heading faq-heading">
              <div>
                <small>POPULAR QUESTIONS</small>
                <h2>Frequently asked questions</h2>
              </div>
              <span>{filteredFaqs.length} articles</span>
            </div>

            <div className="faq-list">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => {
                  const isOpen = openFaq === faq.id;

                  return (
                    <article
                      className={`faq-item ${isOpen ? "open" : ""}`}
                      key={faq.id}
                      style={{ "--faq-index": index }}
                    >
                      <button
                        type="button"
                        className="faq-question"
                        onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                        aria-expanded={isOpen}
                      >
                        <span className="faq-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="faq-question-copy">
                          <small>{faq.category}</small>
                          <strong>{faq.question}</strong>
                        </span>
                        <FiChevronDown className="faq-chevron" />
                      </button>

                      <div className="faq-answer-wrap">
                        <div className="faq-answer">
                          <p>{faq.answer}</p>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="faq-no-results">
                  <span className="faq-no-results-icon">
                    <FiSearch />
                  </span>
                  <h3>No help articles found</h3>
                  <p>Try a different keyword or contact support directly.</p>
                  <button type="button" onClick={() => setSearchQuery("")}>
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="support-hours-card">
            <span className="support-hours-icon">
              <FiClock />
            </span>
            <div>
              <small>SUPPORT HOURS</small>
              <strong>Monday to Friday, 9 AM to 6 PM</strong>
              <p>Email requests can be sent at any time.</p>
            </div>
          </section>
        </main>
      </div>

      <div className="help-bottom-viewport">
        <nav className="help-bottom-navigation" aria-label="Primary navigation">
          {footerItems.map(({ label, path, icon: Icon }) => {
            const active = isFooterActive(path);

            return (
              <button
                type="button"
                key={path}
                className={`help-nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (location.pathname !== path) {
                    navigate(path);
                  }
                }}
              >
                <span className="help-nav-icon">
                  <Icon />
                </span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
