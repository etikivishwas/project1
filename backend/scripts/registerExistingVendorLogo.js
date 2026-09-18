const fs = require("fs");
const path = require("path");
require("dotenv").config();
const db = require("../src/config/database.js");

const vendorId = Number(process.argv[2]);
const fileName = path.basename(process.argv[3] || "");

if (!Number.isInteger(vendorId) || vendorId <= 0 || !fileName) {
  console.error("Usage: node scripts/registerExistingVendorLogo.js VENDOR_ID FILE_NAME");
  process.exit(1);
}

const uploadDirectory = process.env.VENDOR_LOGO_UPLOAD_DIR
  ? path.resolve(process.env.VENDOR_LOGO_UPLOAD_DIR)
  : path.resolve(process.cwd(), "uploads", "vendor-logos");

const filePath = path.join(uploadDirectory, fileName);

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

async function run() {
  try {
    const imageUrl = `/api/images/vendor-logos/${fileName}`;
    const [result] = await db.query(
      `UPDATE vendors
       SET image_url = ?,
           image_blob = NULL,
           image_mime_type = NULL,
           image_original_name = NULL,
           image_size = NULL,
           image_etag = NULL
       WHERE id = ?`,
      [imageUrl, vendorId]
    );

    if (result.affectedRows === 0) {
      throw new Error(`Vendor ${vendorId} was not found.`);
    }

    console.log(`Updated vendor ${vendorId} with ${imageUrl}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (typeof db.end === "function") {
      await db.end();
    }
  }
}

run();
