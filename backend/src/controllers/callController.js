const prisma = require("../prisma"); // Adjusted path
const { recordLeadAction } = require("../utils/auditLogger");

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

    // Allow sales persons and admins to log calls/interactions for any lead.
    // If the lead was unassigned and is being logged by a sales person, auto-assign to them.

    const start = startTime ? new Date(startTime) : new Date();
    const end = endTime ? new Date(endTime) : new Date();
    const durationSecs = Math.max(0, Math.round((end - start) / 1000));

    let followUpDate = null;
    if (followUpAt) {
      const d = new Date(followUpAt);
      if (!isNaN(d.getTime())) {
        followUpDate = d;
      }
    }
    const cleanFollowUpNotes = (typeof followUpNotes === "string" && followUpNotes.trim()) ? followUpNotes.trim() : null;

    const callLog = await prisma.callLog.create({
      data: {
        leadId,
        salesPersonId: req.user.userId,
        startTime: start,
        endTime: end,
        durationSecs,
        notes: (typeof notes === "string" && notes.trim()) ? notes.trim() : (notes || null),
        followUpAt: followUpDate,
        followUpNotes: cleanFollowUpNotes,
      },
    });

    // Update lead with occupation, location, budget, and followUp if set
    const currentFormAnswers = (lead.formAnswers && typeof lead.formAnswers === "object") ? { ...lead.formAnswers } : {};
    if (occupation !== undefined && occupation !== null) {
      currentFormAnswers.occupation = typeof occupation === "string" ? occupation.trim() : String(occupation);
    }
    if (location !== undefined && location !== null) {
      currentFormAnswers.location = typeof location === "string" ? location.trim() : String(location);
    }
    if (budget !== undefined && budget !== null) {
      currentFormAnswers.budget = typeof budget === "string" ? budget.trim() : String(budget);
    }
    if (notes && typeof notes === "string" && notes.trim()) {
      currentFormAnswers.callNotes = notes.trim();
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        formAnswers: currentFormAnswers,
        ...(!lead.assignedToId && req.user.role === "SALES_PERSON" ? { assignedToId: req.user.userId } : {}),
        ...(followUpDate ? { followUpAt: followUpDate } : {}),
        ...(cleanFollowUpNotes ? { followUpNotes: cleanFollowUpNotes } : {}),
      },
    });

    // Log immutable audit record with timestamp
    const istFollowUpStr = followUpDate ? followUpDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : null;
    await recordLeadAction({
      leadId,
      userId: req.user.userId,
      action: "CALL_LOGGED",
      details: `Call recorded. Notes: "${notes || "No call notes"}" | Duration: ${durationSecs}s${istFollowUpStr ? ` | Follow-up: ${istFollowUpStr}` : ""}${cleanFollowUpNotes ? ` (To ask: "${cleanFollowUpNotes}")` : ""}`,
    });

    return res.status(201).json(callLog);
  } catch (err) {
    console.error("Failed to log call:", err);
    return res.status(500).json({ error: err.message || "Failed to log call" });
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
