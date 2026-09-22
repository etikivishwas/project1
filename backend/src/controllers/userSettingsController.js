const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const db = require("../config/database");

const SETTINGS_SELECT = `
  SELECT
    push_notifications AS pushNotifications,
    email_updates AS emailUpdates,
    two_factor_enabled AS twoFactorEnabled,
    data_sharing AS dataSharing,
    profile_visibility AS profileVisibility,
    updated_at AS updatedAt
  FROM user_settings
  WHERE user_id = ?
  LIMIT 1
`;

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

const getSettings = async (
  req,
  res
) => {
  const connection =
    await db.getConnection();

  try {
    await ensureSettings(
      connection,
      req.currentUserId
    );

    const [rows] =
      await connection.query(
        SETTINGS_SELECT,
        [req.currentUserId]
      );

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error(
      "getSettings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Settings could not be loaded.",
    });
  } finally {
    connection.release();
  }
};

const updateSettings = async (
  req,
  res
) => {
  const allowedSettings = {
    pushNotifications: {
      column: "push_notifications",
      type: "boolean",
    },

    emailUpdates: {
      column: "email_updates",
      type: "boolean",
    },

    dataSharing: {
      column: "data_sharing",
      values: [
        "minimal",
        "standard",
        "personalized",
      ],
    },

    profileVisibility: {
      column: "profile_visibility",
      values: [
        "public",
        "private",
      ],
    },
  };

  const updates = [];
  const values = [];
  const updatedFields = [];

  for (
    const [
      clientKey,
      configuration,
    ] of Object.entries(
      allowedSettings
    )
  ) {
    if (
      !Object.prototype.hasOwnProperty.call(
        req.body,
        clientKey
      )
    ) {
      continue;
    }

    const value =
      req.body[clientKey];

    if (
      configuration.type ===
        "boolean" &&
      typeof value !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${clientKey} must be a Boolean value.`,
      });
    }

    if (
      Array.isArray(
        configuration.values
      ) &&
      !configuration.values.includes(
        value
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${clientKey} contains an invalid value.`,
      });
    }

    updates.push(
      `${configuration.column} = ?`
    );

    values.push(
      configuration.type ===
        "boolean"
        ? Number(value)
        : value
    );

    updatedFields.push(clientKey);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      message:
        "No valid settings were supplied.",
    });
  }

  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    await ensureSettings(
      connection,
      req.currentUserId
    );

    values.push(
      req.currentUserId
    );

    await connection.query(
      `
        UPDATE user_settings
        SET
          ${updates.join(", ")},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `,
      values
    );

    const [rows] =
      await connection.query(
        SETTINGS_SELECT,
        [req.currentUserId]
      );

    await writeAudit(
      connection,
      req,
      "settings_updated",
      {
        fields: updatedFields,
      }
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "Settings updated successfully.",
      data: rows[0],
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "Settings rollback error:",
        rollbackError
      );
    }

    console.error(
      "updateSettings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Settings could not be updated.",
    });
  } finally {
    connection.release();
  }
};

const validateNewPassword = (
  newPassword
) => {
  if (
    typeof newPassword !== "string"
  ) {
    return (
      "New password is required."
    );
  }

  if (newPassword.length < 10) {
    return (
      "New password must contain at least 10 characters."
    );
  }

  if (
    !/[A-Z]/.test(newPassword)
  ) {
    return (
      "New password must contain at least one uppercase letter."
    );
  }

  if (
    !/[a-z]/.test(newPassword)
  ) {
    return (
      "New password must contain at least one lowercase letter."
    );
  }

  if (!/\d/.test(newPassword)) {
    return (
      "New password must contain at least one number."
    );
  }

  if (
    !/[^A-Za-z0-9]/.test(
      newPassword
    )
  ) {
    return (
      "New password must contain at least one symbol."
    );
  }

  return "";
};

const changePassword = async (
  req,
  res
) => {
  const currentPassword =
    typeof req.body.currentPassword ===
    "string"
      ? req.body.currentPassword
      : "";

  const newPassword =
    typeof req.body.newPassword ===
    "string"
      ? req.body.newPassword
      : "";

  if (!currentPassword) {
    return res.status(400).json({
      success: false,
      message:
        "Current password is required.",
    });
  }

  const passwordValidationError =
    validateNewPassword(
      newPassword
    );

  if (passwordValidationError) {
    return res.status(400).json({
      success: false,
      message:
        passwordValidationError,
    });
  }

  if (
    currentPassword === newPassword
  ) {
    return res.status(400).json({
      success: false,
      message:
        "New password must differ from the current password.",
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
            id,
            password_hash,
            account_status
          FROM users
          WHERE id = ?
            AND account_status = 'active'
          LIMIT 1
          FOR UPDATE
        `,
        [req.currentUserId]
      );

    const user = rows[0];

    if (!user) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Active user account was not found.",
      });
    }

    const currentPasswordIsValid =
      await bcrypt.compare(
        currentPassword,
        user.password_hash
      );

    if (
      !currentPasswordIsValid
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Current password is incorrect.",
      });
    }

    const passwordIsUnchanged =
      await bcrypt.compare(
        newPassword,
        user.password_hash
      );

    if (passwordIsUnchanged) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "New password must differ from the current password.",
      });
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    await connection.query(
      `
        UPDATE users
        SET
          password_hash = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        passwordHash,
        req.currentUserId,
      ]
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
      "password_changed"
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please sign in again with the new password.",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "Password change rollback error:",
        rollbackError
      );
    }

    console.error(
      "changePassword error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Password could not be changed.",
    });
  } finally {
    connection.release();
  }
};

const deleteAccount = async (
  req,
  res
) => {
  const password =
    typeof req.body.password ===
    "string"
      ? req.body.password
      : "";

  const confirmation =
    typeof req.body.confirmation ===
    "string"
      ? req.body.confirmation
      : "";

  if (!password) {
    return res.status(400).json({
      success: false,
      message:
        "Current password is required.",
    });
  }

  if (confirmation !== "DELETE") {
    return res.status(400).json({
      success: false,
      message:
        "Type DELETE to confirm account deletion.",
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
            id,
            password_hash,
            account_status
          FROM users
          WHERE id = ?
            AND account_status = 'active'
          LIMIT 1
          FOR UPDATE
        `,
        [req.currentUserId]
      );

    const user = rows[0];

    if (!user) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Active user account was not found.",
      });
    }

    const passwordIsValid =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordIsValid) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Current password is incorrect.",
      });
    }

    const uniqueSuffix =
      `${req.currentUserId}-${Date.now()}`;

    const anonymizedEmail =
      `deleted-${uniqueSuffix}@deleted.invalid`;

    const anonymizedMobile =
      `deleted-${uniqueSuffix}`;

    const randomPassword =
      crypto
        .randomBytes(48)
        .toString("hex");

    const disabledPasswordHash =
      await bcrypt.hash(
        randomPassword,
        12
      );

    await connection.query(
      `
        UPDATE users
        SET
          name = 'Deleted User',
          email = ?,
          mobile = ?,
          password_hash = ?,
          is_verified = 0,
          remember_me = 0,
          account_status = 'deleted',
          deleted_at = CURRENT_TIMESTAMP,
          deletion_reason = 'Self-service deletion',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        anonymizedEmail,
        anonymizedMobile,
        disabledPasswordHash,
        req.currentUserId,
      ]
    );

    await connection.query(
      `
        DELETE FROM refresh_tokens
        WHERE user_id = ?
      `,
      [req.currentUserId]
    );

    await connection.query(
      `
        DELETE FROM user_settings
        WHERE user_id = ?
      `,
      [req.currentUserId]
    );

    await writeAudit(
      connection,
      req,
      "account_deleted"
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "Account deleted successfully.",
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "Account deletion rollback error:",
        rollbackError
      );
    }

    console.error(
      "deleteAccount error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Account could not be deleted.",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getSettings,
  updateSettings,
  changePassword,
  deleteAccount,
};