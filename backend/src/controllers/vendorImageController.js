const db = require("../config/database.js");

const sendStoredImage = (req, res, image, mimeField) => {
  const imageBuffer = image.image_blob;
  const mimeType = image[mimeField] || "application/octet-stream";
  const etag = image.image_etag ? `"${image.image_etag}"` : null;

  if (etag && req.headers["if-none-match"] === etag) {
    return res.status(304).end();
  }

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Length", imageBuffer.length);
  res.setHeader("Cache-Control", "public, max-age=86400");

  if (etag) {
    res.setHeader("ETag", etag);
  }

  return res.end(imageBuffer);
};

const streamVendorImage = async (req, res) => {
  const vendorId = Number(req.params.vendorId);

  if (!Number.isInteger(vendorId) || vendorId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid vendor ID." });
  }

  try {
    const [rows] = await db.query(
      `
        SELECT image_blob, image_mime_type, image_etag
        FROM vendors
        WHERE id = ?
          AND image_blob IS NOT NULL
        LIMIT 1
      `,
      [vendorId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Vendor image was not found." });
    }

    return sendStoredImage(req, res, rows[0], "image_mime_type");
  } catch (error) {
    console.error("Stream vendor image error:", error);
    return res.status(500).json({ success: false, message: "Vendor image could not be loaded." });
  }
};

const streamGalleryImage = async (req, res) => {
  const imageId = Number(req.params.imageId);

  if (!Number.isInteger(imageId) || imageId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid gallery image ID." });
  }

  try {
    const [rows] = await db.query(
      `
        SELECT image_blob, mime_type, image_etag
        FROM vendor_gallery
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
      `,
      [imageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Gallery image was not found." });
    }

    return sendStoredImage(req, res, rows[0], "mime_type");
  } catch (error) {
    console.error("Stream gallery image error:", error);
    return res.status(500).json({ success: false, message: "Gallery image could not be loaded." });
  }
};

module.exports = {
  streamVendorImage,
  streamGalleryImage,
};
