const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function protect(req, res, next) {
  try {
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    const token =
      authorization.split(" ")[1];

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        message:
          "Invalid or expired token",
      });
    }

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
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    const user = result.rows[0];

    req.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  protect,
};