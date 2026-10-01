const db = require("../config/database");


// ============================================================
// CONFIGURATION
// ============================================================

// Minimum time between reverse-geocoding requests
// for the same user.
const GEOCODE_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

// User must move at least this much before we consider
// reverse geocoding again.
const MOVEMENT_THRESHOLD_METERS = 250;


// ============================================================
// DISTANCE CALCULATION
// ============================================================

const getDistanceInMeters = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const earthRadius = 6371000;

  const toRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
  };

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
};


// ============================================================
// SAVE USER LOCATION
// ============================================================

const saveUserLocation = async (req, res) => {
  const userId = req.currentUserId;

  const { latitude, longitude } = req.body;


  // ----------------------------------------------------------
  // 1. Validate GPS coordinates
  // ----------------------------------------------------------

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Valid latitude and longitude are required.",
    });
  }

  if (
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Latitude or longitude is outside the valid range.",
    });
  }


  const connection = await db.getConnection();


  try {

    // --------------------------------------------------------
    // 2. Check existing location
    // --------------------------------------------------------

    const [existingRows] = await connection.query(
      `
        SELECT
          latitude,
          longitude,
          address,
          city,
          state,
          postal_code,
          updated_at
        FROM user_locations
        WHERE user_id = ?
        LIMIT 1
      `,
      [userId]
    );


    const existingLocation =
      existingRows.length > 0
        ? existingRows[0]
        : null;


    // --------------------------------------------------------
    // 3. Decide whether reverse geocoding is necessary
    // --------------------------------------------------------

    let shouldReverseGeocode = true;


    if (existingLocation) {

      const previousLatitude =
        Number(existingLocation.latitude);

      const previousLongitude =
        Number(existingLocation.longitude);


      const distanceMoved =
        getDistanceInMeters(
          previousLatitude,
          previousLongitude,
          latitude,
          longitude
        );


      const lastUpdated =
        new Date(
          existingLocation.updated_at
        ).getTime();


      const timeSinceLastUpdate =
        Date.now() - lastUpdated;


      console.log(
        `Location check: user=${userId}, ` +
        `distance=${Math.round(distanceMoved)}m, ` +
        `age=${Math.round(
          timeSinceLastUpdate / 60000
        )}min`
      );


      // ------------------------------------------------------
      // Don't reverse geocode if:
      //
      // 1. Location was updated recently
      // AND
      // 2. User hasn't moved significantly
      // ------------------------------------------------------

      if (
        timeSinceLastUpdate <
          GEOCODE_COOLDOWN_MS &&
        distanceMoved <
          MOVEMENT_THRESHOLD_METERS
      ) {
        shouldReverseGeocode = false;
      }
    }


    // --------------------------------------------------------
    // 4. If no reverse geocoding is necessary
    // --------------------------------------------------------

    if (
      existingLocation &&
      !shouldReverseGeocode
    ) {

      console.log(
        "Skipping reverse geocoding."
      );

      return res.status(200).json({
        success: true,
        message:
          "Existing location is still recent.",
        data: existingLocation,
      });
    }


    // --------------------------------------------------------
    // 5. Reverse geocode using Photon
    // --------------------------------------------------------

    let geoData = null;


    try {

      console.log(
        "Reverse geocoding with Photon..."
      );

      const geoResponse = await fetch(
        `https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            "User-Agent": "TedoBizz/1.0",
            Accept: "application/json",
          },
        }
      );


      if (!geoResponse.ok) {
        throw new Error(
          `Photon returned HTTP ${geoResponse.status}`
        );
      }


      geoData =
        await geoResponse.json();


      console.log(
        "Photon response received."
      );

    } catch (geoError) {

      console.error(
        "Reverse geocoding failed:",
        geoError.message
      );


      // ------------------------------------------------------
      // IMPORTANT:
      // Even if reverse geocoding fails,
      // GPS coordinates should still be saved.
      // ------------------------------------------------------

      if (existingLocation) {

        await connection.query(
          `
            UPDATE user_locations
            SET
              latitude = ?,
              longitude = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `,
          [
            latitude,
            longitude,
            userId,
          ]
        );

      } else {

        await connection.query(
          `
            INSERT INTO user_locations (
              user_id,
              latitude,
              longitude
            )
            VALUES (?, ?, ?)
          `,
          [
            userId,
            latitude,
            longitude,
          ]
        );
      }


      const [rows] =
        await connection.query(
          `
            SELECT
              latitude,
              longitude,
              address,
              city,
              state,
              postal_code,
              updated_at
            FROM user_locations
            WHERE user_id = ?
            LIMIT 1
          `,
          [userId]
        );


      return res.status(200).json({
        success: true,
        message:
          "GPS location saved, but address lookup failed.",
        data: rows[0],
      });
    }


    // --------------------------------------------------------
    // 6. Extract Photon data
    // --------------------------------------------------------

    const properties =
      geoData?.features?.[0]?.properties || {};


    console.log(
      "Photon properties:",
      properties
    );


    const locationName =
      properties.locality ||
      properties.suburb ||
      properties.neighbourhood ||
      properties.district ||
      properties.city ||
      properties.name ||
      null;


    const city =
      properties.city ||
      properties.district ||
      properties.locality ||
      null;


    const state =
      properties.state ||
      null;


    const postalCode =
      properties.postcode ||
      null;


    const fullAddress = [
      properties.name,
      properties.street,
      properties.locality,
      properties.district,
      properties.city,
      properties.state,
      properties.postcode,
      properties.country,
    ]
      .filter(Boolean)
      .join(", ") || null;


    console.log(
      "Location name:",
      locationName
    );

    console.log(
      "Full address:",
      fullAddress
    );

    console.log(
      "City:",
      city
    );

    console.log(
      "State:",
      state
    );

    console.log(
      "Postal code:",
      postalCode
    );


    // --------------------------------------------------------
    // 7. Save everything
    // --------------------------------------------------------

    await connection.query(
      `
        INSERT INTO user_locations (
          user_id,
          latitude,
          longitude,
          address,
          city,
          state,
          postal_code
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE
          latitude = VALUES(latitude),
          longitude = VALUES(longitude),
          address = VALUES(address),
          city = VALUES(city),
          state = VALUES(state),
          postal_code = VALUES(postal_code),
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        userId,
        latitude,
        longitude,
        fullAddress,
        city,
        state,
        postalCode,
      ]
    );


    // --------------------------------------------------------
    // 8. Return saved location
    // --------------------------------------------------------

    const [rows] =
      await connection.query(
        `
          SELECT
            latitude,
            longitude,
            address,
            city,
            state,
            postal_code,
            updated_at
          FROM user_locations
          WHERE user_id = ?
          LIMIT 1
        `,
        [userId]
      );


    return res.status(200).json({
      success: true,
      message:
        "Location saved successfully.",

      data: {
        ...rows[0],
        location_name:
          locationName,
      },
    });

  } catch (error) {

    console.error(
      "saveUserLocation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Location could not be saved.",
    });

  } finally {

    connection.release();

  }
};


// ============================================================
// GET USER LOCATION
// ============================================================

const getUserLocation = async (req, res) => {

  const connection =
    await db.getConnection();


  try {

    const [rows] =
      await connection.query(
        `
          SELECT
            latitude,
            longitude,
            address,
            city,
            state,
            postal_code,
            updated_at
          FROM user_locations
          WHERE user_id = ?
          LIMIT 1
        `,
        [req.currentUserId]
      );


    if (rows.length === 0) {

      return res.status(404).json({
        success: false,
        message:
          "No location saved.",
      });

    }


    const location = rows[0];


    // Try to derive a displayable locality
    // from the information already stored.

    const locationName =
      location.city ||
      null;


    return res.status(200).json({

      success: true,

      data: {
        ...location,
        location_name:
          locationName,
      },

    });

  } catch (error) {

    console.error(
      "getUserLocation error:",
      error
    );


    return res.status(500).json({
      success: false,
      message:
        "Location could not be loaded.",
    });

  } finally {

    connection.release();

  }
};


module.exports = {
  saveUserLocation,
  getUserLocation,
};