const express = require("express");
const { body, validationResult } = require("express-validator");

const {
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
} = require("../controllers/tableController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  next();
}

// Public read routes
router.get("/", getTables);
router.get("/:id", getTableById);

// Admin create
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  [
    body("tableNumber")
      .isInt({ min: 1 })
      .withMessage("Table number must be greater than 0"),

    body("capacity")
      .isInt({ min: 1 })
      .withMessage("Capacity must be greater than 0"),

    body("location")
      .isIn(["Indoor", "Outdoor"])
      .withMessage("Location must be Indoor or Outdoor"),
  ],
  validateRequest,
  createTable
);

// Admin update
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateTable
);

// Admin delete
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteTable
);

module.exports = router;