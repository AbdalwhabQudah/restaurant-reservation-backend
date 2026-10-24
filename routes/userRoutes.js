const express = require("express");

const {
  getProfile,
  updateProfile,
  getCustomers,
} = require("../controllers/userController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/profile",
  protect,
  getProfile
);

router.put(
  "/profile",
  protect,
  updateProfile
);

router.get(
  "/customers",
  protect,
  authorizeRoles("admin"),
  getCustomers
);

module.exports = router;