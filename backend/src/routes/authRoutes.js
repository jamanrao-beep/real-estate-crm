const express = require("express");
const router = express.Router();
const { createUser, login, getAllUsers, toggleUserAvailability } = require("../controllers/authController");
const { requireAuth, adminOnly } = require("../middleware/auth");

// Only an already-logged-in Admin can create new accounts.
router.post("/users", requireAuth, adminOnly, createUser);
router.get("/users", requireAuth, adminOnly, getAllUsers);
router.patch("/users/:id/availability", requireAuth, adminOnly, toggleUserAvailability);

router.post("/login", login);

module.exports = router;
