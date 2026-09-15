const prisma = require("../prisma"); // Adjusted path

// POST /api/calls   body: { leadId, startTime, endTime, notes }
// PRD 5.4 — Sales Person logs a call against a lead.
// Accepts either startTime+endTime (duration auto-computed) or you can
// extend this later to accept a raw durationSecs directly.
async function logCall(req, res) {
  try {
    const { leadId, startTime, endTime, notes, followUpAt, followUpNotes, occupation, location, budget } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: "leadId is required" });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // A sales person can only log calls against their own leads.
    if (req.user.role === "SALES_PERSON" && lead.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: "You can only log calls for leads assigned to you" });
    }

    const start = startTime ? new Date(startTime) : new Date();
    const end = endTime ? new Date(endTime) : new Date();
    const durationSecs = Math.max(0, Math.round((end - start) / 1000));

    const followUpDate = followUpAt ? new Date(followUpAt) : null;
    const cleanFollowUpNotes = followUpNotes ? followUpNotes.trim() : null;

    const callLog = await prisma.callLog.create({
      data: {
        leadId,
        salesPersonId: lead.assignedToId || req.user.userId,
        startTime: start,
        endTime: end,
        durationSecs,
        notes: notes || null,
        followUpAt: followUpDate,
        followUpNotes: cleanFollowUpNotes,
      },
    });

    // Update lead with occupation, location, budget, and followUp if set
    const currentFormAnswers = (lead.formAnswers && typeof lead.formAnswers === "object") ? { ...lead.formAnswers } : {};
    if (occupation !== undefined && occupation !== null) currentFormAnswers.occupation = occupation;
    if (location !== undefined && location !== null) currentFormAnswers.location = location;
    if (budget !== undefined && budget !== null) currentFormAnswers.budget = budget;

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        formAnswers: currentFormAnswers,
        ...(followUpDate && {
          followUpAt: followUpDate,
          followUpNotes: cleanFollowUpNotes,
        }),
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
