const bcrypt = require("bcrypt");
const crypto = require("crypto");

const db = require("../config/database.js");

const PASSWORD_SALT_ROUNDS = 12;

const cleanText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const normalizeEmail = (value) => {
  return cleanText(value).toLowerCase();
};

const normalizePhone = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\D/g, "");
};

const parseServices = (servicesValue) => {
  if (Array.isArray(servicesValue)) {
    return servicesValue;
  }

  if (typeof servicesValue === "string") {
    try {
      const parsed = JSON.parse(servicesValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const parseRequiredPrice = (value) => {
  const normalizedValue = cleanText(String(value ?? ""));

  if (!normalizedValue) {
    return Number.NaN;
  }

  return Number(normalizedValue);
};

const validateRegistration = (body) => {
  const errors = {};

  const businessName = cleanText(body.businessName);
  const ownerName = cleanText(body.ownerName);
  const mobileNumber = normalizePhone(body.mobileNumber);
  const category = cleanText(body.category);
  const postalCode = cleanText(body.postalCode || body.location);
  const whatsapp = normalizePhone(body.whatsapp);
  const email = normalizeEmail(body.email);
  const address = cleanText(body.address);
  const city = cleanText(body.city);
  const state = cleanText(body.state);
  const aboutBusiness = cleanText(body.aboutBusiness);
  const experience = cleanText(body.experience);
  const openingTime = cleanText(body.openingTime);
  const closingTime = cleanText(body.closingTime);

  const password =
    typeof body.password === "string" ? body.password : "";

  const confirmPassword =
    typeof body.confirmPassword === "string"
      ? body.confirmPassword
      : "";

  const services = parseServices(body.services);
  const minPrice = parseRequiredPrice(body.minPrice);
  const maxPrice = parseRequiredPrice(body.maxPrice);

  if (!businessName) {
    errors.businessName = "Business name is required.";
  }

  if (!ownerName) {
    errors.ownerName = "Owner name is required.";
  }

  if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
    errors.mobileNumber =
      "Enter a valid 10-digit mobile number.";
  }

  if (!category) {
    errors.category = "Category is required.";
  }

  if (!/^[1-9]\d{5}$/.test(postalCode)) {
    errors.postalCode =
      "Enter a valid 6-digit postal code.";
  }

  if (!/^[6-9]\d{9}$/.test(whatsapp)) {
    errors.whatsapp =
      "Enter a valid 10-digit WhatsApp number.";
  }

  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    errors.email = "Enter a valid email address.";
  }

  if (!address) {
    errors.address = "Street address is required.";
  }

  if (!city) {
    errors.city = "City is required.";
  }

  if (!state) {
    errors.state = "State is required.";
  }

  if (!aboutBusiness) {
    errors.aboutBusiness =
      "Business description is required.";
  }

  if (!experience) {
    errors.experience =
      "Years of experience is required.";
  }

  if (services.length === 0) {
    errors.services = "Select at least one service.";
  }

  if (Number.isNaN(minPrice) || minPrice < 0) {
    errors.minPrice = "Enter a valid minimum price.";
  }

  if (Number.isNaN(maxPrice) || maxPrice < 0) {
    errors.maxPrice = "Enter a valid maximum price.";
  }

  if (
    !Number.isNaN(minPrice) &&
    !Number.isNaN(maxPrice) &&
    maxPrice < minPrice
  ) {
    errors.maxPrice =
      "Maximum price cannot be below minimum price.";
  }

  if (!openingTime) {
    errors.openingTime = "Opening time is required.";
  }

  if (!closingTime) {
    errors.closingTime = "Closing time is required.";
  }

  if (
    openingTime &&
    closingTime &&
    openingTime === closingTime
  ) {
    errors.closingTime =
      "Opening and closing times cannot be the same.";
  }

  if (password.length < 8) {
    errors.password =
      "Password must contain at least 8 characters.";
  } else if (
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    errors.password =
      "Password must contain uppercase, lowercase and a number.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
};

const findCategory = async (connection, categoryValue) => {
  const categoryId = Number(categoryValue);

  if (Number.isInteger(categoryId) && categoryId > 0) {
    const [rows] = await connection.query(
      `
        SELECT id, name
        FROM vendor_categories
        WHERE id = ?
          AND status = 'active'
        LIMIT 1
      `,
      [categoryId]
    );

    return rows[0] || null;
  }

  const categoryName = cleanText(categoryValue);

  const [rows] = await connection.query(
    `
      SELECT id, name
      FROM vendor_categories
      WHERE LOWER(name) = LOWER(?)
        AND status = 'active'
      LIMIT 1
    `,
    [categoryName]
  );

  return rows[0] || null;
};

const registerVendor = async (req, res) => {
  let connection;

  try {
    const validationErrors = validateRegistration(req.body);

    if (Object.keys(validationErrors).length > 0) {
      return res.status(422).json({
        success: false,
        message: "Please correct the registration details.",
        errors: validationErrors,
      });
    }

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Please log in before registering as a vendor.",
      });
    }

    const businessName = cleanText(req.body.businessName);
    const ownerName = cleanText(req.body.ownerName);
    const mobileNumber = normalizePhone(req.body.mobileNumber);
    const whatsapp = normalizePhone(req.body.whatsapp);
    const email = normalizeEmail(req.body.email);
    const postalCode = cleanText(
      req.body.postalCode || req.body.location
    );
    const address = cleanText(req.body.address);
    const city = cleanText(req.body.city);
    const state = cleanText(req.body.state);
    const landmark = cleanText(req.body.landmark) || null;
    const aboutBusiness = cleanText(req.body.aboutBusiness);
    const experience = cleanText(req.body.experience);
    const minPrice = parseRequiredPrice(req.body.minPrice);
    const maxPrice = parseRequiredPrice(req.body.maxPrice);
    const openingTime = cleanText(req.body.openingTime);
    const closingTime = cleanText(req.body.closingTime);
    const services = parseServices(req.body.services);

    // This controller expects multer.memoryStorage().
    const logoBuffer = req.file?.buffer || null;
    const logoMimeType = req.file?.mimetype || null;
    const logoOriginalName = req.file?.originalname || null;
    const logoSize = req.file?.size || null;
    const logoEtag = logoBuffer
      ? crypto
          .createHash("sha256")
          .update(logoBuffer)
          .digest("hex")
      : null;

    // New vendor images are streamed through /api/images.
    const logoUrl = null;

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [userRows] = await connection.query(
      `
        SELECT id
        FROM users
        WHERE id = ?
        LIMIT 1
        FOR UPDATE
      `,
      [userId]
    );

    if (userRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "User account was not found.",
      });
    }

    const [existingVendorRows] = await connection.query(
      `
        SELECT id
        FROM vendors
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    if (existingVendorRows.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "A vendor registration already exists for this user.",
        vendorId: existingVendorRows[0].id,
      });
    }

    const [existingEmailRows] = await connection.query(
      `
        SELECT id
        FROM vendor_panel_accounts
        WHERE email = ?
        LIMIT 1
      `,
      [email]
    );

    if (existingEmailRows.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "This email is already registered for the vendor panel.",
        errors: {
          email: "This email is already registered.",
        },
      });
    }

    const category = await findCategory(
      connection,
      req.body.category
    );

    if (!category) {
      await connection.rollback();

      return res.status(422).json({
        success: false,
        message: "The selected vendor category is invalid.",
        errors: {
          category: "Select an active vendor category.",
        },
      });
    }

    const passwordHash = await bcrypt.hash(
      req.body.password,
      PASSWORD_SALT_ROUNDS
    );

    const [vendorResult] = await connection.query(
      `
        INSERT INTO vendors (
          user_id,
          name,
          owner_name,
          service_type,
          category_id,
          description,
          image_url,
          image_blob,
          image_mime_type,
          image_original_name,
          image_size,
          image_etag,
          phone,
          whatsapp,
          email,
          address,
          city,
          state,
          postal_code,
          landmark,
          years_of_experience,
          minimum_price,
          maximum_price,
          opening_time,
          closing_time,
          is_verified,
          is_premium,
          is_active,
          registration_status,
          submitted_at
        )
        VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          0, 0, 0, 'submitted', NOW()
        )
      `,
      [
        userId,
        businessName,
        ownerName,
        category.name,
        category.id,
        aboutBusiness,
        logoUrl,
        logoBuffer,
        logoMimeType,
        logoOriginalName,
        logoSize,
        logoEtag,
        mobileNumber,
        whatsapp,
        email,
        address,
        city,
        state,
        postalCode,
        landmark,
        experience,
        minPrice,
        maxPrice,
        openingTime,
        closingTime,
      ]
    );

    const vendorId = vendorResult.insertId;
    const generatedLogoUrl = logoBuffer
      ? `/api/images/vendors/${vendorId}/main`
      : null;

    await connection.query(
      `
        INSERT INTO vendor_panel_accounts (
          existing_vendor_id,
          business_name,
          contact_name,
          email,
          password_hash,
          avatar_url,
          status,
          email_verified
        )
        VALUES (?, ?, ?, ?, ?, ?, 'active', 0)
      `,
      [
        vendorId,
        businessName,
        ownerName,
        email,
        passwordHash,
        generatedLogoUrl,
      ]
    );

    const uniqueServices = [
      ...new Set(
        services
          .map((service) => {
            if (typeof service === "string") {
              return cleanText(service);
            }

            return cleanText(service?.name);
          })
          .filter(Boolean)
      ),
    ];

    for (const serviceName of uniqueServices) {
      await connection.query(
        `
          INSERT INTO vendor_services (
            vendor_id,
            service_id,
            category_id,
            name,
            description,
            pricing_type,
            price_min,
            price_max,
            image_url,
            status
          )
          VALUES (
            ?,
            NULL,
            NULL,
            ?,
            NULL,
            'range',
            ?,
            ?,
            NULL,
            'draft'
          )
        `,
        [vendorId, serviceName, minPrice, maxPrice]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message:
        "Vendor registration completed successfully.",
      data: {
        vendorId,
        accountEmail: email,
        registrationStatus: "submitted",
        vendorPanelAccountCreated: true,
        logoUrl: generatedLogoUrl,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => undefined);
    }

    console.error("Vendor registration error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "A vendor or vendor-panel account already exists with these details.",
      });
    }

    if (error.code === "ER_DATA_TOO_LONG") {
      return res.status(413).json({
        success: false,
        message:
          "The uploaded image is too large for the database configuration.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Vendor registration could not be completed.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getMyVendorRegistration = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const [rows] = await db.query(
      `
        SELECT
          v.id,
          v.name AS businessName,
          v.owner_name AS ownerName,
          v.phone AS mobileNumber,
          v.whatsapp,
          v.email,
          v.address,
          v.city,
          v.state,
          v.postal_code AS postalCode,
          v.landmark,
          v.description AS aboutBusiness,
          v.years_of_experience AS experience,
          v.minimum_price AS minPrice,
          v.maximum_price AS maxPrice,
          v.opening_time AS openingTime,
          v.closing_time AS closingTime,
          CASE
            WHEN v.image_blob IS NOT NULL
              THEN CONCAT(
                '/api/images/vendors/',
                v.id,
                '/main'
              )
            ELSE NULL
          END AS logoUrl,
          v.registration_status AS registrationStatus,
          vc.id AS categoryId,
          vc.name AS categoryName,
          vpa.email AS vendorPanelEmail,
          vpa.email_verified AS emailVerified
        FROM vendors v
        LEFT JOIN vendor_categories vc
          ON vc.id = v.category_id
        LEFT JOIN vendor_panel_accounts vpa
          ON vpa.existing_vendor_id = v.id
        WHERE v.user_id = ?
        LIMIT 1
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No vendor registration was found.",
      });
    }

    const vendor = rows[0];

    const [serviceRows] = await db.query(
      `
        SELECT
          id,
          name,
          description,
          pricing_type AS pricingType,
          price_min AS minPrice,
          price_max AS maxPrice,
          status
        FROM vendor_services
        WHERE vendor_id = ?
        ORDER BY sort_order, id
      `,
      [vendor.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...vendor,
        services: serviceRows,
      },
    });
  } catch (error) {
    console.error("Get vendor registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve vendor registration.",
    });
  }
};

module.exports = {
  registerVendor,
  getMyVendorRegistration,
};
