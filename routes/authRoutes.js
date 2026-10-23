const express = require("express");

const {
  body,
} = require("express-validator");

const {
  register,
  login,
  getMe,
} = require("../controllers/authController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// ============================================
// REGISTER
// ============================================

router.post(
  "/register",

  [
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage(
        "Full name must contain at least 2 characters"
      ),

    body("email")
      .trim()
      .isEmail()
      .withMessage(
        "Please provide a valid email address"
      ),

    body("phone")
      .trim()
      .notEmpty()
      .withMessage(
        "Phone number is required"
      ),

    body("password")
      .isLength({ min: 8 })
      .withMessage(
        "Password must contain at least 8 characters"
      ),
  ],

  register
);

// ============================================
// LOGIN
// ============================================

router.post(
  "/login",

  [
    body("email")
      .trim()
      .isEmail()
      .withMessage(
        "Please provide a valid email address"
      ),

    body("password")
      .notEmpty()
      .withMessage(
        "Password is required"
      ),
  ],

  login
);

// ============================================
// CURRENT USER
// ============================================

router.get(
  "/me",
  protect,
  getMe
);

// ============================================
// TEST ADMIN AUTHORIZATION
// ============================================

router.get(
  "/admin-only",

  protect,

  authorizeRoles("admin"),

  (req, res) => {
    res.status(200).json({
      message:
        "Admin authorization successful",

      user: req.user,
    });
  }
);

module.exports = router;