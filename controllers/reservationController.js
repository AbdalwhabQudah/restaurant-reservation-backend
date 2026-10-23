const pool = require("../config/db");

// =====================================================
// HELPER: FIND AVAILABLE TABLE
// =====================================================

async function findAvailableTable({
  date,
  time,
  guests,
  excludeReservationId = null,
}) {
  const values = [guests, date, time];

  let excludeCondition = "";

  if (excludeReservationId) {
    values.push(excludeReservationId);

    excludeCondition = `
      AND r.id <> $4
    `;
  }

  const result = await pool.query(
    `
    SELECT
      rt.id,
      rt.table_number,
      rt.capacity,
      rt.location
    FROM restaurant_tables rt
    WHERE
      rt.is_active = TRUE
      AND rt.capacity >= $1

      AND NOT EXISTS (
        SELECT 1
        FROM reservations r
        WHERE
          r.table_id = rt.id
          AND r.reservation_date = $2
          AND r.reservation_time = $3
          AND r.status IN ('Pending', 'Confirmed')
          ${excludeCondition}
      )

    ORDER BY
      rt.capacity ASC,
      rt.table_number ASC

    LIMIT 1
    `,
    values
  );

  return result.rows[0] || null;
}

// =====================================================
// CHECK AVAILABILITY
// GET /api/reservations/availability
// =====================================================

async function checkAvailability(req, res, next) {
  try {
    const {
      date,
      time,
      guests,
    } = req.query;

    if (!date || !time || !guests) {
      return res.status(400).json({
        message:
          "date, time and guests are required",
      });
    }

    const guestCount = Number(guests);

    if (
      !Number.isInteger(guestCount) ||
      guestCount <= 0
    ) {
      return res.status(400).json({
        message:
          "Guests must be a positive integer",
      });
    }

    const table = await findAvailableTable({
      date,
      time,
      guests: guestCount,
    });

    if (!table) {
      return res.status(200).json({
        available: false,
        message:
          "No suitable table is available",
      });
    }

    res.status(200).json({
      available: true,

      table: {
        id: table.id,
        tableNumber:
          table.table_number,
        capacity:
          table.capacity,
        location:
          table.location,
      },
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// CREATE RESERVATION
// CUSTOMER
// POST /api/reservations
// =====================================================

async function createReservation(
  req,
  res,
  next
) {
  try {
    const {
      reservationDate,
      reservationTime,
      guestCount,
      specialRequest,
    } = req.body;

    const table =
      await findAvailableTable({
        date: reservationDate,
        time: reservationTime,
        guests: guestCount,
      });

    if (!table) {
      return res.status(409).json({
        message:
          "No suitable table is available for the selected date and time",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO reservations (
        user_id,
        table_id,
        reservation_date,
        reservation_time,
        guest_count,
        status,
        special_request
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        'Pending',
        $6
      )
      RETURNING
  id,
  user_id,
  table_id,
  TO_CHAR(
    reservation_date,
    'YYYY-MM-DD'
  ) AS reservation_date,
  TO_CHAR(
    reservation_time,
    'HH24:MI'
  ) AS reservation_time,
  guest_count,
  status,
  special_request
      `,
      [
        req.user.id,
        table.id,
        reservationDate,
        reservationTime,
        guestCount,
        specialRequest || null,
      ]
    );

    res.status(201).json({
      message:
        "Reservation created successfully",

      reservation:
        result.rows[0],

      assignedTable: {
        id: table.id,
        tableNumber:
          table.table_number,
        capacity:
          table.capacity,
        location:
          table.location,
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "This table was just booked. Please try again.",
      });
    }

    next(error);
  }
}

// =====================================================
// GET CUSTOMER'S RESERVATIONS
// GET /api/reservations/my
// =====================================================

async function getMyReservations(
  req,
  res,
  next
) {
  try {
    const result = await pool.query(
      `
      SELECT
        r.id,
        TO_CHAR(
  r.reservation_date,
  'YYYY-MM-DD'
) AS reservation_date,

TO_CHAR(
  r.reservation_time,
  'HH24:MI'
) AS reservation_time,
        r.guest_count,
        r.status,
        r.special_request,

        rt.id AS table_id,
        rt.table_number,
        rt.capacity,
        rt.location

      FROM reservations r

      JOIN restaurant_tables rt
        ON r.table_id = rt.id

      WHERE r.user_id = $1

      ORDER BY
        r.reservation_date DESC,
        r.reservation_time DESC
      `,
      [req.user.id]
    );

    res.status(200).json({
      count: result.rows.length,
      reservations:
        result.rows,
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// UPDATE OWN RESERVATION
// PUT /api/reservations/:id
// =====================================================

async function updateMyReservation(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;

    const existingResult =
      await pool.query(
        `
        SELECT *
        FROM reservations
        WHERE
          id = $1
          AND user_id = $2
        `,
        [id, req.user.id]
      );

    if (
      existingResult.rows.length === 0
    ) {
      return res.status(404).json({
        message:
          "Reservation not found",
      });
    }

    const existing =
      existingResult.rows[0];

    if (
      ["Completed", "Cancelled", "Rejected"]
        .includes(existing.status)
    ) {
      return res.status(400).json({
        message:
          "This reservation can no longer be edited",
      });
    }

    const reservationDate =
      req.body.reservationDate ??
      existing.reservation_date;

    const reservationTime =
      req.body.reservationTime ??
      existing.reservation_time;

    const guestCount =
      req.body.guestCount ??
      existing.guest_count;

    const specialRequest =
      req.body.specialRequest !==
      undefined
        ? req.body.specialRequest
        : existing.special_request;

    const table =
      await findAvailableTable({
        date: reservationDate,
        time: reservationTime,
        guests: guestCount,
        excludeReservationId: id,
      });

    if (!table) {
      return res.status(409).json({
        message:
          "No suitable table is available for the updated reservation",
      });
    }

    const result = await pool.query(
      `
      UPDATE reservations
      SET
        table_id = $1,
        reservation_date = $2,
        reservation_time = $3,
        guest_count = $4,
        special_request = $5,
        status = 'Pending'
      WHERE
        id = $6
        AND user_id = $7

      RETURNING
  id,
  user_id,
  table_id,
  TO_CHAR(
    reservation_date,
    'YYYY-MM-DD'
  ) AS reservation_date,
  TO_CHAR(
    reservation_time,
    'HH24:MI'
  ) AS reservation_time,
  guest_count,
  status,
  special_request

      `,
      [
        table.id,
        reservationDate,
        reservationTime,
        guestCount,
        specialRequest || null,
        id,
        req.user.id,
      ]
    );

    res.status(200).json({
      message:
        "Reservation updated successfully",

      reservation:
        result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// CANCEL OWN RESERVATION
// PATCH /api/reservations/:id/cancel
// =====================================================

async function cancelMyReservation(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE reservations
      SET status = 'Cancelled'
      WHERE
        id = $1
        AND user_id = $2
        AND status IN (
          'Pending',
          'Confirmed'
        )

      RETURNING
  id,
  user_id,
  table_id,
  TO_CHAR(
    reservation_date,
    'YYYY-MM-DD'
  ) AS reservation_date,
  TO_CHAR(
    reservation_time,
    'HH24:MI'
  ) AS reservation_time,
  guest_count,
  status,
  special_request

      `,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          "Reservation cannot be cancelled or does not exist",
      });
    }

    res.status(200).json({
      message:
        "Reservation cancelled successfully",

      reservation:
        result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// ADMIN: GET ALL RESERVATIONS
// GET /api/reservations
// =====================================================

async function getAllReservations(
  req,
  res,
  next
) {
  try {
    const result = await pool.query(
      `
      SELECT
        r.id,

        u.id AS user_id,
        u.full_name AS customer_name,
        u.email AS customer_email,

        rt.id AS table_id,
        rt.table_number,

        r.reservation_date,
        r.reservation_time,
        r.guest_count,
        r.status,
        r.special_request

      FROM reservations r

      JOIN users u
        ON r.user_id = u.id

      JOIN restaurant_tables rt
        ON r.table_id = rt.id

      ORDER BY
        r.reservation_date DESC,
        r.reservation_time DESC
      `
    );

    res.status(200).json({
      count: result.rows.length,
      reservations:
        result.rows,
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// ADMIN: CHANGE STATUS
// PATCH /api/reservations/:id/status
// =====================================================

async function updateReservationStatus(
  req,
  res,
  next
) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Completed",
      "Cancelled",
      "Rejected",
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid reservation status",
      });
    }

    const result = await pool.query(
      `
      UPDATE reservations
      SET status = $1
      WHERE id = $2

      RETURNING
  id,
  user_id,
  table_id,
  TO_CHAR(
    reservation_date,
    'YYYY-MM-DD'
  ) AS reservation_date,
  TO_CHAR(
    reservation_time,
    'HH24:MI'
  ) AS reservation_time,
  guest_count,
  status,
  special_request
  
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          "Reservation not found",
      });
    }

    res.status(200).json({
      message:
        "Reservation status updated successfully",

      reservation:
        result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "This table already has another active reservation at that time",
      });
    }

    next(error);
  }
}

module.exports = {
  checkAvailability,
  createReservation,
  getMyReservations,
  updateMyReservation,
  cancelMyReservation,
  getAllReservations,
  updateReservationStatus,
};