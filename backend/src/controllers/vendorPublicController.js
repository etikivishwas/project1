const db = require("../config/database.js");

const formatTime = (value) => {
  if (!value) return null;
  const [hourValue, minute = "00"] = String(value).split(":");
  const hour = Number(hourValue);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
};

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const createPriceLabel = (service) => {
  const minPrice = service.priceMin == null ? null : Number(service.priceMin);
  const maxPrice = service.priceMax == null ? null : Number(service.priceMax);

  if (service.pricingType === "quote" || (minPrice === null && maxPrice === null)) {
    return "Get quote";
  }
  if (service.pricingType === "fixed") return formatPrice(minPrice ?? maxPrice);
  if (service.pricingType === "starting_from") return `From ${formatPrice(minPrice ?? maxPrice)}`;
  if (minPrice !== null && maxPrice !== null) {
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  }
  return formatPrice(minPrice ?? maxPrice);
};

const getVendorById = async (req, res) => {
  const vendorId = Number(req.params.vendorId);

  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid vendor ID." });
  }

  try {
    const [vendorRows] = await db.query(
      `
        SELECT
          v.id,
          v.name,
          v.owner_name AS ownerName,
          v.service_type AS serviceType,
          v.description,
          v.years_of_experience AS yearsOfExperience,
          v.minimum_price AS minimumPrice,
          v.maximum_price AS maximumPrice,
          v.opening_time AS openingTime,
          v.closing_time AS closingTime,
          v.rating,
          v.is_verified AS isVerified,
          v.is_premium AS isPremium,
          CASE
            WHEN v.image_blob IS NOT NULL
              THEN CONCAT('/api/images/vendors/', v.id, '/main')
            ELSE NULL
          END AS imageUrl,
          v.phone,
          v.whatsapp,
          v.email,
          v.address,
          v.city,
          v.state,
          v.postal_code AS postalCode,
          v.landmark,
          vc.name AS categoryName,
          (
            SELECT COUNT(*)
            FROM service_history sh
            WHERE sh.vendor_id = v.id
              AND sh.status = 'completed'
          ) AS completedBookings,
          (
            SELECT COUNT(*)
            FROM vendor_panel_reviews vr
            WHERE vr.vendor_id = v.id
              AND vr.status = 'published'
          ) AS reviewCount
        FROM vendors v
        LEFT JOIN vendor_categories vc ON vc.id = v.category_id
        WHERE v.id = ?
          AND v.is_active = 1
          AND v.registration_status = 'approved'
        LIMIT 1
      `,
      [vendorId]
    );

    if (vendorRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendor was not found or is unavailable.",
      });
    }

    const vendor = vendorRows[0];
    const [serviceResult, galleryResult, reviewResult] = await Promise.all([
      db.query(
        `
          SELECT
            id,
            name,
            description,
            pricing_type AS pricingType,
            price_min AS priceMin,
            price_max AS priceMax
          FROM vendor_services
          WHERE vendor_id = ?
            AND status = 'active'
          ORDER BY sort_order, id
        `,
        [vendorId]
      ),
      db.query(
        `
          SELECT
            id,
            CONCAT('/api/images/gallery/', id) AS imageUrl,
            caption
          FROM vendor_gallery
          WHERE vendor_id = ?
            AND is_active = 1
          ORDER BY sort_order, id
          LIMIT 12
        `,
        [vendorId]
      ),
      db.query(
        `
          SELECT
            id,
            customer_name AS customerName,
            rating,
            review_text AS reviewText,
            created_at AS createdAt
          FROM vendor_panel_reviews
          WHERE vendor_id = ?
            AND status = 'published'
          ORDER BY created_at DESC
          LIMIT 6
        `,
        [vendorId]
      ),
    ]);

    let services = serviceResult[0];
    const gallery = galleryResult[0];
    const reviews = reviewResult[0];

    if (
      services.length === 0 &&
      (vendor.minimumPrice !== null || vendor.maximumPrice !== null)
    ) {
      services = [
        {
          id: null,
          name: vendor.serviceType,
          description: vendor.description,
          pricingType: "range",
          priceMin: vendor.minimumPrice,
          priceMax: vendor.maximumPrice,
          synthetic: true,
        },
      ];
    }

    const formattedServices = services.map((service) => ({
      ...service,
      priceLabel: createPriceLabel(service),
    }));

    const addressParts = [
      vendor.address,
      vendor.landmark,
      vendor.city,
      vendor.state,
      vendor.postalCode,
    ].filter(Boolean);

    const openingTime = formatTime(vendor.openingTime);
    const closingTime = formatTime(vendor.closingTime);
    const businessHours =
      openingTime && closingTime
        ? `${openingTime} - ${closingTime}`
        : "Contact provider for availability";
    const fullAddress =
      addressParts.length > 0
        ? addressParts.join(", ")
        : vendor.city || "Service location available on request";

    return res.status(200).json({
      success: true,
      data: {
        ...vendor,
        isVerified: Boolean(vendor.isVerified),
        isPremium: Boolean(vendor.isPremium),
        experienceLabel: vendor.yearsOfExperience || "Experienced team",
        responseLabel: "Quick",
        businessHours,
        fullAddress,
        services: formattedServices,
        gallery,
        reviews,
      },
    });
  } catch (error) {
    console.error("Get vendor details error:", error);
    return res.status(500).json({
      success: false,
      message: "Vendor details could not be loaded.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const createVendorBooking = async (req, res) => {
  const vendorId = Number(req.params.vendorId);
  const userId = req.user?.id;
  const vendorServiceId = Number(req.body.vendorServiceId);
  const serviceDate = String(req.body.serviceDate || "").trim();
  const notes = String(req.body.notes || "").trim();

  if (!userId) {
    return res.status(401).json({ success: false, message: "Please log in to book a service." });
  }
  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid vendor ID." });
  }
  if (!Number.isInteger(vendorServiceId) || vendorServiceId <= 0) {
    return res.status(422).json({ success: false, message: "Select a valid service." });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) {
    return res.status(422).json({ success: false, message: "Select a valid service date." });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (serviceDate < today) {
    return res.status(422).json({ success: false, message: "Service date cannot be in the past." });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [serviceRows] = await connection.query(
      `
        SELECT vs.id, vs.name
        FROM vendor_services vs
        INNER JOIN vendors v ON v.id = vs.vendor_id
        WHERE vs.id = ?
          AND vs.vendor_id = ?
          AND vs.status = 'active'
          AND v.is_active = 1
          AND v.registration_status = 'approved'
        LIMIT 1
      `,
      [vendorServiceId, vendorId]
    );

    if (serviceRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "The selected service is unavailable." });
    }

    const bookingNotes = [serviceRows[0].name, notes].filter(Boolean).join(" | ");
    const [bookingResult] = await connection.query(
      `
        INSERT INTO service_history (
          user_id,
          vendor_id,
          service_id,
          vendor_service_id,
          status,
          interaction_type,
          service_date,
          notes
        )
        VALUES (?, ?, NULL, ?, 'requested', 'booking', ?, ?)
      `,
      [userId, vendorId, vendorServiceId, serviceDate, bookingNotes || null]
    );

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Booking request sent successfully.",
      data: { bookingId: bookingResult.insertId, status: "requested" },
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => undefined);
    console.error("Create vendor booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Booking request could not be created.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getVendorById,
  createVendorBooking,
};
