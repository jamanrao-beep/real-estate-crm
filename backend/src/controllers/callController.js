const prisma = require("../prisma"); // Adjusted path

// POST /api/calls   body: { leadId, startTime, endTime, notes }
// PRD 5.4 — Sales Person logs a call against a lead.
// Accepts either startTime+endTime (duration auto-computed) or you can
// extend this later to accept a raw durationSecs directly.
async function logCall(req, res) {
  try {
    const { leadId, startTime, endTime, notes } = req.body;

    if (!leadId || !startTime || !endTime) {
      return res.status(400).json({ error: "leadId, startTime, and endTime are required" });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // A sales person can only log calls against their own leads.
    if (req.user.role === "SALES_PERSON" && lead.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: "You can only log calls for leads assigned to you" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationSecs = Math.max(0, Math.round((end - start) / 1000));

    const callLog = await prisma.callLog.create({
      data: {
        leadId,
        salesPersonId: lead.assignedToId || req.user.userId,
        startTime: start,
        endTime: end,
        durationSecs,
        notes,
      },
    });

    return res.status(201).json(callLog);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to log call" });
  }
}

// GET /api/calls/mine   (Sales Person's own call history)
async function getMyCalls(req, res) {
  try {
    const calls = await prisma.callLog.findMany({
      where: { salesPersonId: req.user.userId },
      include: { lead: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(calls);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch your calls" });
  }
}

// GET /api/calls   (Admin — all calls, filterable)
// Feeds directly into the "call hours" / "number of calls" figures in the
// PRD 4.3 performance dashboard.
async function getAllCalls(req, res) {
  try {
    const { salesPersonId, leadId, from, to } = req.query;

    const calls = await prisma.callLog.findMany({
      where: {
        ...(salesPersonId && { salesPersonId }),
        ...(leadId && { leadId }),
        ...((from || to) && {
          createdAt: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }),
      },
      include: {
        lead: { select: { id: true, name: true } },
        salesPerson: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(calls);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch calls" });
  }
}

module.exports = { logCall, getMyCalls, getAllCalls };
