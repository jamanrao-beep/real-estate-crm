const express = require("express");
const router = express.Router();
const {
  createDeal,
  getDeal,
  logTransaction,
  getMyTransactions,
  getAllTransactions,
  unlockTransaction,
  editTransaction,
} = require("../controllers/paymentController");
const { requireAuth, adminOnly, salesOnly } = require("../middleware/auth");

// Deals
router.post("/deals", requireAuth, salesOnly, createDeal);
router.get("/deals/:id", requireAuth, getDeal); // ownership checked inside controller

// Transactions
router.post("/deals/:dealId/transactions", requireAuth, salesOnly, logTransaction);
router.get("/transactions/mine", requireAuth, salesOnly, getMyTransactions);
router.get("/transactions", requireAuth, adminOnly, getAllTransactions);
router.patch("/transactions/:id/unlock", requireAuth, adminOnly, unlockTransaction);
router.patch("/transactions/:id", requireAuth, editTransaction); // ownership + lock checked inside

module.exports = router;
