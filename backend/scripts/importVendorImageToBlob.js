const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();
const db = require("../src/config/database.js");

const vendorId = Number(process.argv[2]);
const imagePath = path.resolve(process.argv[3] || "");
const mimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function run() {
  try {
    if (!Number.isInteger(vendorId) || vendorId <= 0 || !process.argv[3]) {
      throw new Error("Usage: node scripts/importVendorImageToBlob.js VENDOR_ID IMAGE_PATH");
    }
    if (!fs.existsSync(imagePath)) throw new Error(`Image not found: ${imagePath}`);

    const mimeType = mimeTypes[path.extname(imagePath).toLowerCase()];
    if (!mimeType) throw new Error("Only JPG, PNG, and WEBP images are supported.");

    const imageBuffer = fs.readFileSync(imagePath);
    if (imageBuffer.length > 5 * 1024 * 1024) throw new Error("Image is larger than 5 MB.");

    const imageEtag = crypto.createHash("sha256").update(imageBuffer).digest("hex");
    const [result] = await db.query(
      `
        UPDATE vendors
        SET image_url = NULL,
            image_blob = ?,
            image_mime_type = ?,
            image_original_name = ?,
            image_size = ?,
            image_etag = ?
        WHERE id = ?
      `,
      [imageBuffer, mimeType, path.basename(imagePath), imageBuffer.length, imageEtag, vendorId]
    );

    if (result.affectedRows === 0) throw new Error(`Vendor ${vendorId} was not found.`);
    console.log(`Imported image for vendor ${vendorId}.`);
    console.log(`Image URL: /api/images/vendors/${vendorId}/main`);
  } catch (error) {
    console.error("Import failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (typeof db.end === "function") await db.end();
  }
}

run();
