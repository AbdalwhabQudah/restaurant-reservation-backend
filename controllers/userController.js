const pool = require("../config/db");

// ============================================
// GET CURRENT PROFILE
// GET /api/users/profile
// ============================================

async function getProfile(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        role
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// UPDATE CURRENT PROFILE
// PUT /api/users/profile
// ============================================

async function updateProfile(req, res, next) {
  try {
    const currentResult = await pool.query(
      `
      SELECT *
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const current = currentResult.rows[0];

    const fullName =
      req.body.fullName ?? current.full_name;

    const email =
      req.body.email ?? current.email;

    const phone =
      req.body.phone ?? current.phone;

    const result = await pool.query(
      `
      UPDATE users
      SET
        full_name = $1,
        email = $2,
        phone = $3
      WHERE id = $4
      RETURNING
        id,
        full_name,
        email,
        phone,
        role
      `,
      [
        String(fullName).trim(),
        String(email).trim().toLowerCase(),
        String(phone).trim(),
        req.user.id,
      ]
    );

    const user = result.rows[0];

    res.status(200).json({
      message: "Profile updated successfully",

      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message:
          "Email is already used by another account",
      });
    }

    next(error);
  }
}

// ============================================
// ADMIN: GET CUSTOMERS
// GET /api/users/customers
// ============================================

async function getCustomers(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,

        COUNT(r.id)::integer
          AS reservation_count

      FROM users u

      LEFT JOIN reservations r
        ON r.user_id = u.id

      WHERE u.role = 'customer'

      GROUP BY
        u.id,
        u.full_name,
        u.email,
        u.phone

      ORDER BY u.full_name
    `);

    const customers = result.rows.map(
      (user) => ({
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        reservationCount:
          user.reservation_count,
      })
    );

    res.status(200).json({
      count: customers.length,
      customers,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getCustomers,
};