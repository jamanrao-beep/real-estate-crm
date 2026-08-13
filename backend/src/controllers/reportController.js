const prisma = require("../prisma");
const { toCSV } = require("../utils/csv");

// Resolves a month/year query param into a [startDate, endDate) range.
// Defaults to the current month if not provided.
function resolveMonthRange(month, year) {
  const now = new Date();
  const y = year ? parseInt(year, 10) : now.getFullYear();
  const m = month ? parseInt(month, 10) : now.getMonth() + 1; // 1-12
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1); // first day of next month (exclusive upper bound)
  return { start, end };
}

// Core aggregation for one sales person over a date range.
// This is the PRD 4.3 dashboard, computed field by field.
async function computePerformance(salesPersonId, start, end) {
  const [
    leadsAssignedCount,
    dealsClosedCount,
    siteVisitsCount,
    callAgg,
    categoryGroups,
    funnelGroups,
    dealValueAgg,
    paymentsAgg,
  ] = await Promise.all([
    // Total leads received: leads assigned to this person during the period
    prisma.leadAssignmentHistory.count({
      where: { assignedToId: salesPersonId, assignedAt: { gte: start, lt: end } },
    }),

    // Total leads converted: distinct leads that hit DEAL_CLOSED in this period
    prisma.leadStatusHistory.count({
      where: {
        stage: "DEAL_CLOSED",
        changedAt: { gte: start, lt: end },
        lead: { assignedToId: salesPersonId },
      },
    }),

    // Number of site visits done in this period
    prisma.leadStatusHistory.count({
      where: {
        stage: "SITE_VISIT_DONE",
        changedAt: { gte: start, lt: end },
        lead: { assignedToId: salesPersonId },
      },
    }),

    // Call hours + number of calls
    prisma.callLog.aggregate({
      where: { salesPersonId, createdAt: { gte: start, lt: end } },
      _sum: { durationSecs: true },
      _count: true,
    }),

    // Current Hot/Warm/Cold breakdown (a snapshot, not period-bound —
    // category isn't historically tracked in this schema)
    prisma.lead.groupBy({
      by: ["category"],
      where: { assignedToId: salesPersonId },
      _count: true,
    }),

    // Current funnel breakdown (snapshot)
    prisma.lead.groupBy({
      by: ["funnelStage"],
      where: { assignedToId: salesPersonId },
      _count: true,
    }),

    // Total sales value closed: deals created in this period for this rep's leads
    prisma.deal.aggregate({
      where: { lead: { assignedToId: salesPersonId }, createdAt: { gte: start, lt: end } },
      _sum: { dealAmount: true },
    }),

    // Total payments collected in this period
    prisma.transaction.aggregate({
      where: { loggedById: salesPersonId, createdAt: { gte: start, lt: end } },
      _sum: { amountPaid: true },
    }),
  ]);

  return {
    totalLeadsReceived: leadsAssignedCount,
    totalLeadsConverted: dealsClosedCount,
    siteVisitsDone: siteVisitsCount,
    numberOfCalls: callAgg._count,
    callHours: Math.round(((callAgg._sum.durationSecs || 0) / 3600) * 100) / 100,
    categoryBreakdown: categoryGroups.map((g) => ({ category: g.category, count: g._count })),
    funnelBreakdown: funnelGroups.map((g) => ({ stage: g.funnelStage, count: g._count })),
    totalSalesValueClosed: Number(dealValueAgg._sum.dealAmount || 0),
    totalPaymentsCollected: Number(paymentsAgg._sum.amountPaid || 0),
  };
}

// GET /api/reports/performance/:salesPersonId?month=&year=
async function getSalesPersonPerformance(req, res) {
  try {
    const { salesPersonId } = req.params;
    const { month, year } = req.query;
    const { start, end } = resolveMonthRange(month, year);

    const salesPerson = await prisma.user.findUnique({ where: { id: salesPersonId } });
    if (!salesPerson || salesPerson.role !== "SALES_PERSON") {
      return res.status(404).json({ error: "Sales person not found" });
    }

    const performance = await computePerformance(salesPersonId, start, end);
    return res.json({ salesPerson: { id: salesPerson.id, name: salesPerson.name }, period: { start, end }, ...performance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to compute performance report" });
  }
}

// GET /api/reports/performance?month=&year=
// All sales people at once — the Admin's monthly overview.
async function getAllPerformance(req, res) {
  try {
    const { month, year } = req.query;
    const { start, end } = resolveMonthRange(month, year);

    const salesPeople = await prisma.user.findMany({ where: { role: "SALES_PERSON" } });

    const results = await Promise.all(
      salesPeople.map(async (sp) => ({
        salesPerson: { id: sp.id, name: sp.name },
        ...(await computePerformance(sp.id, start, end)),
      }))
    );

    return res.json({ period: { start, end }, results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to compute performance reports" });
  }
}

// GET /api/reports/transactions/export   (Admin — all transactions, filterable, as CSV)
// PRD 4.4 + 7 — "Download/export all transactions."
async function exportAllTransactions(req, res) {
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
        deal: { include: { lead: { select: { name: true } } } },
        loggedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const csv = toCSV(transactions, [
      { label: "Transaction ID", value: "id" },
      { label: "Client", value: (t) => t.deal.lead.name },
      { label: "Deal Amount", value: (t) => t.deal.dealAmount },
      { label: "Amount Paid", value: "amountPaid" },
      { label: "Payment Mode", value: "paymentMode" },
      { label: "Reference Number", value: "referenceNumber" },
      { label: "Logged By", value: (t) => t.loggedBy.name },
      { label: "Date", value: (t) => t.createdAt.toISOString() },
      { label: "Locked", value: "isLocked" },
    ]);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=transactions.csv");
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to export transactions" });
  }
}

// GET /api/reports/transactions/mine/export   (Sales Person — their own, as CSV)
async function exportMyTransactions(req, res) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { loggedById: req.user.userId },
      include: { deal: { include: { lead: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    const csv = toCSV(transactions, [
      { label: "Transaction ID", value: "id" },
      { label: "Client", value: (t) => t.deal.lead.name },
      { label: "Deal Amount", value: (t) => t.deal.dealAmount },
      { label: "Amount Paid", value: "amountPaid" },
      { label: "Payment Mode", value: "paymentMode" },
      { label: "Reference Number", value: "referenceNumber" },
      { label: "Date", value: (t) => t.createdAt.toISOString() },
    ]);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=my-transactions.csv");
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to export your transactions" });
  }
}

module.exports = {
  getSalesPersonPerformance,
  getAllPerformance,
  exportAllTransactions,
  exportMyTransactions,
};
