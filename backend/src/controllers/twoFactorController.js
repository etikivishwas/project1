const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");

const {
  generateSecret,
  generateURI,
  verify,
} = require("otplib");

const db = require("../config/database");

const {
  encryptSecret,
  decryptSecret,
} = require(
  "../services/settingsCrypto"
);

const ensureSettings = async (
  connection,
  userId
) => {
  await connection.query(
    `
      INSERT INTO user_settings (
        user_id
      )
      VALUES (?)
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id)
    `,
    [userId]
  );
};

const writeAudit = async (
  connection,
  req,
  eventType,
  metadata = null
) => {
  await connection.query(
    `
      INSERT INTO user_security_audit_logs (
        user_id,
        event_type,
        ip_address,
        user_agent,
        metadata
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      req.currentUserId,
      eventType,
      req.ip || null,
      String(
        req.get("user-agent") || ""
      ).slice(0, 255) || null,
      metadata
        ? JSON.stringify(metadata)
        : null,
    ]
  );
};

const verifyAuthenticatorCode = async (
  secret,
  token
) => {
  const verificationResult =
    await verify({
      secret,
      token,
    });

  return Boolean(
    verificationResult &&
      verificationResult.valid
  );
};

const beginTwoFactorSetup = async (
  req,
  res
) => {
  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    const [users] =
      await connection.query(
        `
          SELECT
            id,
            email,
            account_status
          FROM users
          WHERE id = ?
            AND account_status = 'active'
          LIMIT 1
          FOR UPDATE
        `,
        [req.currentUserId]
      );

    const user = users[0];

    if (!user) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Active user account was not found.",
      });
    }

    await ensureSettings(
      connection,
      req.currentUserId
    );

    const [settingsRows] =
      await connection.query(
        `
          SELECT
            two_factor_enabled
          FROM user_settings
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [req.currentUserId]
      );

    const twoFactorEnabled =
      Boolean(
        settingsRows[0]
          ?.two_factor_enabled
      );

    if (twoFactorEnabled) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Two-factor authentication is already enabled.",
      });
    }

    const secret = generateSecret();

    const userLabel =
      user.email ||
      `user-${req.currentUserId}`;

    const otpauthUrl = generateURI({
      issuer: "Tezo Bizz",
      label: userLabel,
      secret,
    });

    const qrCodeDataUrl =
      await QRCode.toDataURL(
        otpauthUrl,
        {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 280,
        }
      );

    const encryptedPendingSecret =
      encryptSecret(secret);

    await connection.query(
      `
        UPDATE user_settings
        SET
          two_factor_pending_secret_encrypted = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `,
      [
        encryptedPendingSecret,
        req.currentUserId,
      ]
    );

    await writeAudit(
      connection,
      req,
      "two_factor_setup_started"
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "Two-factor setup started.",

      data: {
        secret,
        otpauthUrl,
        qrCodeDataUrl,
      },
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "2FA setup rollback error:",
        rollbackError
      );
    }

    console.error(
      "beginTwoFactorSetup error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Two-factor setup could not be started.",
    });
  } finally {
    connection.release();
  }
};

const confirmTwoFactorSetup = async (
  req,
  res
) => {
  const token = String(
    req.body.token || ""
  )
    .replace(/\D/g, "")
    .slice(0, 6);

  if (!/^\d{6}$/.test(token)) {
    return res.status(400).json({
      success: false,
      message:
        "Enter a valid six-digit code.",
    });
  }

  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] =
      await connection.query(
        `
          SELECT
            two_factor_enabled,
            two_factor_pending_secret_encrypted
          FROM user_settings
          WHERE user_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [req.currentUserId]
      );

    const settings = rows[0];

    if (!settings) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Start two-factor setup first.",
      });
    }

    if (
      Boolean(
        settings.two_factor_enabled
      )
    ) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Two-factor authentication is already enabled.",
      });
    }

    const pendingEncryptedSecret =
      settings
        .two_factor_pending_secret_encrypted;

    if (!pendingEncryptedSecret) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Start two-factor setup first.",
      });
    }

    const secret = decryptSecret(
      pendingEncryptedSecret
    );

    const codeIsValid =
      await verifyAuthenticatorCode(
        secret,
        token
      );

    if (!codeIsValid) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "The verification code is invalid or expired.",
      });
    }

    const encryptedActiveSecret =
      encryptSecret(secret);

    await connection.query(
      `
        UPDATE user_settings
        SET
          two_factor_enabled = 1,
          two_factor_secret_encrypted = ?,
          two_factor_pending_secret_encrypted = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `,
      [
        encryptedActiveSecret,
        req.currentUserId,
      ]
    );

    await writeAudit(
      connection,
      req,
      "two_factor_enabled"
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "Two-factor authentication enabled.",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "2FA confirmation rollback error:",
        rollbackError
      );
    }

    console.error(
      "confirmTwoFactorSetup error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Two-factor authentication could not be enabled.",
    });
  } finally {
    connection.release();
  }
};

const disableTwoFactor = async (
  req,
  res
) => {
  const password = String(
    req.body.password || ""
  );

  const token = String(
    req.body.token || ""
  )
    .replace(/\D/g, "")
    .slice(0, 6);

  if (!password) {
    return res.status(400).json({
      success: false,
      message:
        "Current password is required.",
    });
  }

  if (!/^\d{6}$/.test(token)) {
    return res.status(400).json({
      success: false,
      message:
        "Enter a valid six-digit code.",
    });
  }

  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] =
      await connection.query(
        `
          SELECT
            u.password_hash,
            u.account_status,
            us.two_factor_enabled,
            us.two_factor_secret_encrypted
          FROM users u
          INNER JOIN user_settings us
            ON us.user_id = u.id
          WHERE u.id = ?
            AND u.account_status = 'active'
          LIMIT 1
          FOR UPDATE
        `,
        [req.currentUserId]
      );

    const record = rows[0];

    if (!record) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Active user account was not found.",
      });
    }

    if (
      !Boolean(
        record.two_factor_enabled
      )
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Two-factor authentication is not enabled.",
      });
    }

    const passwordIsValid =
      await bcrypt.compare(
        password,
        record.password_hash
      );

    if (!passwordIsValid) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Current password is incorrect.",
      });
    }

    if (
      !record
        .two_factor_secret_encrypted
    ) {
      await connection.rollback();

      return res.status(500).json({
        success: false,
        message:
          "The two-factor configuration is incomplete.",
      });
    }

    const secret = decryptSecret(
      record
        .two_factor_secret_encrypted
    );

    const codeIsValid =
      await verifyAuthenticatorCode(
        secret,
        token
      );

    if (!codeIsValid) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "The authenticator code is invalid or expired.",
      });
    }

    await connection.query(
      `
        UPDATE user_settings
        SET
          two_factor_enabled = 0,
          two_factor_secret_encrypted = NULL,
          two_factor_pending_secret_encrypted = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `,
      [req.currentUserId]
    );

    await connection.query(
      `
        DELETE FROM refresh_tokens
        WHERE user_id = ?
      `,
      [req.currentUserId]
    );

    await writeAudit(
      connection,
      req,
      "two_factor_disabled"
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "Two-factor authentication disabled.",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "2FA disable rollback error:",
        rollbackError
      );
    }

    console.error(
      "disableTwoFactor error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Two-factor authentication could not be disabled.",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
};