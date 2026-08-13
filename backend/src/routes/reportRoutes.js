const express = require("express");
const router = express.Router();
const {
  getSalesPersonPerformance,
  getAllPerformance,
  exportAllTransactions,
  exportMyTransactions,
} = require("../controllers/reportController");
const { requireAuth, adminOnly, salesOnly } = require("../middleware/auth");

// PRD 4.3 — monthly performance dashboard
router.get("/performance", requireAuth, adminOnly, getAllPerformance);
router.get("/performance/:salesPersonId", requireAuth, adminOnly, getSalesPersonPerformance);

// PRD 4.4 + 7 — transaction exports
router.get("/transactions/export", requireAuth, adminOnly, exportAllTransactions);
router.get("/transactions/mine/export", requireAuth, salesOnly, exportMyTransactions);

module.exports = router;
