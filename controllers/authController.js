const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const pool = require("../config/db");

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
}

// ============================================
// REGISTER CUSTOMER
// POST /api/auth/register
// ============================================

async function register(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      fullName,
      email,
      phone,
      password,
    } = req.body;

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // Check if email already exists
    const existingUser = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      `,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    // Public registration ALWAYS creates customer
    const result = await pool.query(
      `
      INSERT INTO users (
        full_name,
        email,
        phone,
        password_hash,
        role
      )
      VALUES ($1, $2, $3, $4, 'customer')
      RETURNING
        id,
        full_name,
        email,
        phone,
        role
      `,
      [
        fullName.trim(),
        normalizedEmail,
        phone.trim(),
        passwordHash,
      ]
    );

    const user = result.rows[0];

    const token = generateToken(user);

    return res.status(201).json({
      message: "Account created successfully",

      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },

      token,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// LOGIN
// POST /api/auth/login
// ============================================

async function login(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        password_hash,
        role
      FROM users
      WHERE LOWER(email) = LOWER($1)
      `,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",

      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },

      token,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// CURRENT USER
// GET /api/auth/me
// ============================================

async function getMe(req, res) {
  return res.status(200).json({
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  getMe,
};