const express = require("express");
const router = express.Router();
const {
  getSalesPersonPerformance,
  getAllPerformance,
  exportPerformance,
  exportAllTransactions,
  exportMyTransactions,
} = require("../controllers/reportController");
const { getAllUsers } = require("../controllers/authController");
const { requireAuth, adminOnly, salesOnly } = require("../middleware/auth");

// Sales Team route (supports both /api/reports/sales-team and /api/auth/users)
router.get("/sales-team", requireAuth, adminOnly, getAllUsers);

// PRD 4.3 — monthly performance dashboard
router.get("/performance/export", requireAuth, adminOnly, exportPerformance);
router.get("/performance", requireAuth, adminOnly, getAllPerformance);
router.get("/performance/:salesPersonId", requireAuth, adminOnly, getSalesPersonPerformance);

// PRD 4.4 + 7 — transaction exports
router.get("/transactions/export", requireAuth, adminOnly, exportAllTransactions);
router.get("/transactions/mine/export", requireAuth, salesOnly, exportMyTransactions);

module.exports = router;
