import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiArrowLeft,
  FiSearch,
  FiPhone,
  FiMessageCircle,
  FiMail,
  FiChevronDown,
  FiHome,
  FiClock,
} from "react-icons/fi";

import "./HelpSupport.css";

function HelpSupport() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  // =====================================================
  // FAQ DATA
  // =====================================================

  const faqs = [
    {
      id: 1,
      question:
        "How do I verify my service provider profile?",

      answer:
        "You can verify a service provider by checking the verified badge displayed on their profile. You can also review their ratings, reviews, service details and other available information before contacting them.",
    },

    {
      id: 2,
      question:
        "What is the process for handling a disputed lead?",

      answer:
        "If you have an issue with a service provider or a lead, open your Service History and select the relevant service request. You can then contact our support team with the details of the issue. Our support team will review the request and help resolve the dispute.",
    },

    {
      id: 3,
      question:
        "How can I upgrade to a Featured Listing?",

      answer:
        "To upgrade a service provider to a Featured Listing, go to the relevant provider or vendor section and select the Featured Listing option. Follow the available payment and confirmation steps to complete the upgrade.",
    },
  ];

  // =====================================================
  // FILTER FAQ
  // =====================================================

  const filteredFaqs = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    if (!query) {
      return faqs;
    }

    return faqs.filter((faq) => {
      return (
        faq.question
          .toLowerCase()
          .includes(query) ||
        faq.answer
          .toLowerCase()
          .includes(query)
      );
    });
  }, [searchQuery]);

  // =====================================================
  // FAQ TOGGLE
  // =====================================================

  const handleFaqClick = (id) => {
    setOpenFaq(
      openFaq === id ? null : id
    );
  };

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleBack = () => {
    navigate("/userProfile");
  };

  const handleHome = () => {
    navigate("/userScreen");
  };

  const handleSearch = () => {
    console.log(
      "Search page not developed yet"
    );
  };

  const handleHistory = () => {
    navigate("/userHistory");
  };

  // =====================================================
  // CONTACT ACTIONS
  // =====================================================

  const handleDirectCall = () => {
    window.location.href =
      "tel:+919381423238";
  };

  const handleLiveChat = () => {
    /*
      Live chat will be implemented here.

      For now we are keeping this as a placeholder.
    */

    console.log(
      "Live chat will be opened here."
    );
  };

  const handleEmailSupport = () => {
    window.location.href =
      "mailto:support@milieuglobal.com";
  };

  return (
    <div className="help-page">
      {/* =================================================
          HEADER
          ================================================= */}
      <header className="help-header">
        <button
          className="help-back-button"
          onClick={handleBack}
          aria-label="Go back"
        >
          <FiArrowLeft />
        </button>
        <h1>
          Help &amp; Support
        </h1>
      </header>
      <main className="help-content">
        <div className="help-search-wrapper">
          <FiSearch className="help-search-icon" />
          <input
            type="text"
            className="help-search-input"
            placeholder="Search Help..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
          />
        </div>

        <section className="help-section">
          <h2 className="help-section-title">
            Contact Us
          </h2>
          <div className="contact-grid">
            {/* DIRECT CALL */}
            <button
              className="contact-card"
              onClick={handleDirectCall}
              type="button"
            >
              <div className="contact-icon call-icon">
                <FiPhone />
              </div>
              <h3>
                Direct Call
              </h3>
              <p>
                Mon-Fri, 9am-6pm
              </p>
            </button>
            
            <button
              className="contact-card"
              onClick={handleLiveChat}
              type="button"
            >
              <div className="contact-icon chat-icon">
                <FiMessageCircle />
              </div>
              <h3>
                Live Chat
              </h3>
              <p>
                Typical reply: 5 mins
              </p>
            </button>

            {/* EMAIL SUPPORT */}

            <button
              className="contact-card"
              onClick={handleEmailSupport}
              type="button"
            >
              <div className="contact-icon email-icon">
                <FiMail />
              </div>
              <h3>
                Email Support
              </h3>
              <p>
                support@milieuglobal.com
              </p>
            </button>
          </div>
        </section>

        {/* =================================================
            FAQ
            ================================================= */}
        <section className="help-section faq-section">
          <h2 className="help-section-title">
            Frequently Asked Questions
          </h2>
          <div className="faq-list">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isOpen =
                  openFaq === faq.id;
                return (
                  <div
                    className={`faq-item ${
                      isOpen
                        ? "faq-item-open"
                        : ""
                    }`}
                    key={faq.id}
                  >
                    <button
                      className="faq-question"
                      onClick={() =>
                        handleFaqClick(
                          faq.id
                        )
                      }
                      type="button"
                      aria-expanded={isOpen}
                    >

                      <span>
                        {faq.question}
                      </span>
                      <FiChevronDown
                        className={`faq-chevron ${
                          isOpen
                            ? "faq-chevron-open"
                            : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="faq-answer">
                        <p>
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="faq-no-results">
                <p>
                  No help articles found.
                </p>
                <span>
                  Try searching with a
                  different keyword.
                </span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* =================================================
          BOTTOM NAVIGATION
          ================================================= */}

      <nav className="help-bottom-navigation">
        {/* HOME */}
        <button
          className="help-nav-item active"
          onClick={handleHome}
          type="button"
        >
          <FiHome />
          <span>
            Home
          </span>
        </button>
        {/* SEARCH */}
        <button
          className="help-nav-item"
          onClick={handleSearch}
          type="button"
        >
          <FiSearch />
          <span>
            Search
          </span>
        </button>
        {/* HISTORY */}
        <button
          className="help-nav-item"
          onClick={handleHistory}
          type="button"
        >
          <FiClock />
          <span>
            History
          </span>
        </button>
      </nav>
    </div>
  );
}

export default HelpSupport;