const express = require("express");

const {
  body,
  validationResult,
} = require("express-validator");

const {
  checkAvailability,
  createReservation,
  getMyReservations,
  updateMyReservation,
  cancelMyReservation,
  getAllReservations,
  updateReservationStatus,
} = require(
  "../controllers/reservationController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const {
  authorizeRoles,
} = require(
  "../middleware/roleMiddleware"
);

const router = express.Router();

function validateRequest(
  req,
  res,
  next
) {
  const errors =
    validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message:
        "Validation failed",
      errors: errors.array(),
    });
  }

  next();
}

// Public availability check
router.get(
  "/availability",
  checkAvailability
);

// Customer reservations
router.get(
  "/my",
  protect,
  authorizeRoles("customer"),
  getMyReservations
);

router.post(
  "/",
  protect,
  authorizeRoles("customer"),

  [
    body("reservationDate")
      .isISO8601()
      .withMessage(
        "Valid reservation date is required"
      ),

    body("reservationTime")
      .matches(
        /^([01]\d|2[0-3]):([0-5]\d)$/
      )
      .withMessage(
        "Time must use HH:MM format"
      ),

    body("guestCount")
      .isInt({ min: 1 })
      .withMessage(
        "Guest count must be greater than 0"
      ),
  ],

  validateRequest,

  createReservation
);

router.put(
  "/:id",
  protect,
  authorizeRoles("customer"),
  updateMyReservation
);

router.patch(
  "/:id/cancel",
  protect,
  authorizeRoles("customer"),
  cancelMyReservation
);

// Admin
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllReservations
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  updateReservationStatus
);

module.exports = router;