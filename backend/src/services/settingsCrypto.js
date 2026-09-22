const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH_BYTES = 32;
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const PAYLOAD_VERSION = "v1";

let cachedEncryptionKey = null;

const getKey = () => {
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }

  const encodedKey = String(
    process.env.SETTINGS_ENCRYPTION_KEY || ""
  ).trim();

  if (!encodedKey) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY is not configured."
    );
  }

  const key = Buffer.from(encodedKey, "base64");

  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      "SETTINGS_ENCRYPTION_KEY must decode to exactly 32 bytes."
    );
  }

  cachedEncryptionKey = key;

  return cachedEncryptionKey;
};

const validatePlainText = (plainText) => {
  if (
    plainText === null ||
    plainText === undefined
  ) {
    throw new TypeError(
      "The secret to encrypt is required."
    );
  }

  const normalizedValue = String(plainText).trim();

  if (!normalizedValue) {
    throw new TypeError(
      "The secret to encrypt cannot be empty."
    );
  }

  return normalizedValue;
};

const encryptSecret = (plainText) => {
  const normalizedValue =
    validatePlainText(plainText);

  const key = getKey();

  const initializationVector =
    crypto.randomBytes(IV_LENGTH_BYTES);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    initializationVector,
    {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    }
  );

  const encryptedData = Buffer.concat([
    cipher.update(
      normalizedValue,
      "utf8"
    ),
    cipher.final(),
  ]);

  const authenticationTag =
    cipher.getAuthTag();

  return [
    PAYLOAD_VERSION,
    initializationVector.toString(
      "base64url"
    ),
    authenticationTag.toString(
      "base64url"
    ),
    encryptedData.toString(
      "base64url"
    ),
  ].join(".");
};

const parseEncryptedPayload = (payload) => {
  if (
    typeof payload !== "string" ||
    !payload.trim()
  ) {
    throw new TypeError(
      "Encrypted secret is required."
    );
  }

  const parts = payload.trim().split(".");

  if (
    parts.length === 4 &&
    parts[0] === PAYLOAD_VERSION
  ) {
    return {
      version: parts[0],
      initializationVectorValue: parts[1],
      authenticationTagValue: parts[2],
      encryptedDataValue: parts[3],
    };
  }

  if (parts.length === 3) {
    return {
      version: "legacy",
      initializationVectorValue: parts[0],
      authenticationTagValue: parts[1],
      encryptedDataValue: parts[2],
    };
  }

  throw new Error(
    "Encrypted secret has an unsupported format."
  );
};

const decodeBase64Url = (
  value,
  fieldName
) => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${fieldName} is missing.`
    );
  }

  let decodedValue;

  try {
    decodedValue = Buffer.from(
      value,
      "base64url"
    );
  } catch {
    throw new Error(
      `${fieldName} is invalid.`
    );
  }

  if (decodedValue.length === 0) {
    throw new Error(
      `${fieldName} is empty.`
    );
  }

  return decodedValue;
};

const decryptSecret = (payload) => {
  const {
    initializationVectorValue,
    authenticationTagValue,
    encryptedDataValue,
  } = parseEncryptedPayload(payload);

  const initializationVector =
    decodeBase64Url(
      initializationVectorValue,
      "Initialization vector"
    );

  const authenticationTag =
    decodeBase64Url(
      authenticationTagValue,
      "Authentication tag"
    );

  const encryptedData =
    decodeBase64Url(
      encryptedDataValue,
      "Encrypted data"
    );

  if (
    initializationVector.length !==
    IV_LENGTH_BYTES
  ) {
    throw new Error(
      "Encrypted secret contains an invalid initialization vector."
    );
  }

  if (
    authenticationTag.length !==
    AUTH_TAG_LENGTH_BYTES
  ) {
    throw new Error(
      "Encrypted secret contains an invalid authentication tag."
    );
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    initializationVector,
    {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    }
  );

  decipher.setAuthTag(authenticationTag);

  try {
    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    return decryptedData.toString("utf8");
  } catch {
    throw new Error(
      "Encrypted secret could not be decrypted. The encrypted value or encryption key is invalid."
    );
  }
};

const verifyEncryptionConfiguration = () => {
  getKey();

  const testValue =
    `settings-encryption-test-${Date.now()}`;

  const encryptedValue =
    encryptSecret(testValue);

  const decryptedValue =
    decryptSecret(encryptedValue);

  if (decryptedValue !== testValue) {
    throw new Error(
      "Settings encryption verification failed."
    );
  }

  return true;
};

module.exports = {
  encryptSecret,
  decryptSecret,
  verifyEncryptionConfiguration,
};