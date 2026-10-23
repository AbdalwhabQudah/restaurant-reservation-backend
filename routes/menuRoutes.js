const express = require("express");

const { body } = require("express-validator");

const {
  getCategories,
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// Public
router.get("/categories", getCategories);

router.get("/", getMenuItems);

router.get("/:id", getMenuItemById);

// Admin only
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  [
    body("categoryId")
      .isInt({ min: 1 })
      .withMessage("Valid categoryId is required"),

    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name is required"),

    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),

    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be greater than 0"),
  ],
  createMenuItem
);

router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  updateMenuItem
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteMenuItem
);

module.exports = router;