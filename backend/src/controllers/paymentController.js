const prisma = require("../prisma"); // Adjusted path

const PAYMENT_MODES_REQUIRING_REFERENCE = ["UPI", "NET_BANKING", "CHEQUE", "RTGS"];

// Helper: compute running balance for a deal (dealAmount - sum of payments)
function withRunningBalance(deal) {
  const totalPaid = deal.transactions.reduce((sum, t) => sum + Number(t.amountPaid), 0);
  return {
    ...deal,
    totalPaid,
    runningBalance: Number(deal.dealAmount) - totalPaid,
  };
}

// POST /api/deals   body: { leadId, dealAmount }
// PRD 5.5 — created when a deal is closed (fully or partially).
async function createDeal(req, res) {
  try {
    const { leadId, dealAmount } = req.body;

    if (!leadId || dealAmount == null) {
      return res.status(400).json({ error: "leadId and dealAmount are required" });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    if (req.user.role === "SALES_PERSON" && lead.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: "You can only create deals for leads assigned to you" });
    }

    const deal = await prisma.deal.create({
      data: { leadId, dealAmount },
    });

    return res.status(201).json(deal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create deal" });
  }
}

// GET /api/deals/:id   — deal detail with all transactions + running balance
async function getDeal(req, res) {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        transactions: { orderBy: { createdAt: "asc" } },
        lead: { select: { id: true, name: true, assignedToId: true } },
      },
    });

    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    if (req.user.role === "SALES_PERSON" && deal.lead.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: "You can only view deals for your own leads" });
    }

    return res.json(withRunningBalance(deal));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch deal" });
  }
}

// GET /api/deals/mine
async function getMyDeals(req, res) {
  try {
    const deals = await prisma.deal.findMany({
      where: { lead: { assignedToId: req.user.userId } },
      include: { 
        lead: { select: { id: true, name: true } },
        transactions: true
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json(deals.map(withRunningBalance));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch your deals" });
  }
}

// POST /api/deals/:dealId/transactions
// body: { amountPaid, paymentMode, referenceNumber }
// PRD 5.5 — logs an installment payment. Multiple entries allowed per deal.
// createdAt is server-set only (Q5) — never accepted from the client.
async function logTransaction(req, res) {
  try {
    const { dealId } = req.params;
    const { amountPaid, paymentMode, referenceNumber } = req.body;

    if (amountPaid == null || !paymentMode) {
      return res.status(400).json({ error: "amountPaid and paymentMode are required" });
    }

    if (PAYMENT_MODES_REQUIRING_REFERENCE.includes(paymentMode) && !referenceNumber) {
      return res.status(400).json({ error: `referenceNumber is required for ${paymentMode}` });
    }

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { lead: { select: { assignedToId: true } } },
    });
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    if (req.user.role === "SALES_PERSON" && deal.lead.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: "You can only log payments for your own leads' deals" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        dealId,
        amountPaid,
        paymentMode,
        referenceNumber: paymentMode === "CASH" ? referenceNumber || null : referenceNumber,
        loggedById: req.user.userId,
        // isLocked defaults to true — Q6 decision: locked the moment it's saved
      },
    });

    return res.status(201).json(transaction);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to log transaction" });
  }
}

// GET /api/transactions/mine   (Sales Person — their own logged transactions)
async function getMyTransactions(req, res) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { loggedById: req.user.userId },
      include: { deal: { include: { lead: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(transactions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch your transactions" });
  }
}

// GET /api/transactions   (Admin — all transactions, filterable)
// PRD 4.4 — filter by sales person, client, date range, deal.
async function getAllTransactions(req, res) {
  try {
    const { salesPersonId, leadId, dealId, from, to } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: {
        ...(salesPersonId && { loggedById: salesPersonId }),
        ...(dealId && { dealId }),
        ...(leadId && { deal: { leadId } }),
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      },
      include: {
        deal: { include: { lead: { select: { id: true, name: true } } } },
        loggedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(transactions);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
}

// PATCH /api/transactions/:id/unlock   (Admin only)
// Q6 — Admin approves a correction by unlocking the transaction.
async function unlockTransaction(req, res) {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        isLocked: false,
        unlockedById: req.user.userId,
        unlockedAt: new Date(),
      },
    });

    return res.json(transaction);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to unlock transaction" });
  }
}

// PATCH /api/transactions/:id   (Sales Person, only while unlocked)
// The actual correction, made only after Admin has unlocked it.
// Re-locks automatically once saved.
async function editTransaction(req, res) {
  try {
    const { id } = req.params;
    const { amountPaid, paymentMode, referenceNumber } = req.body;

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.isLocked) {
      return res.status(403).json({ error: "This transaction is locked. Ask an Admin to unlock it first." });
    }

    if (req.user.role === "SALES_PERSON" && transaction.loggedById !== req.user.userId) {
      return res.status(403).json({ error: "You can only edit your own transactions" });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(amountPaid != null && { amountPaid }),
        ...(paymentMode && { paymentMode }),
        ...(referenceNumber !== undefined && { referenceNumber }),
        isLocked: true, // re-lock after the correction is made
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to edit transaction" });
  }
}

module.exports = {
  createDeal,
  getDeal,
  getMyDeals,
  logTransaction,
  getMyTransactions,
  getAllTransactions,
  unlockTransaction,
  editTransaction,
};
