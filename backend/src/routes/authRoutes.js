const express = require("express");
const router = express.Router();
const { createUser, login } = require("../controllers/authController");
const { requireAuth, adminOnly } = require("../middleware/auth");

// Only an already-logged-in Admin can create new accounts.
// (For your very first Admin account, insert it manually via
// Prisma Studio or a one-off seed script — see note below.)
router.post("/users", requireAuth, adminOnly, createUser);

router.post("/login", login);

module.exports = router;
