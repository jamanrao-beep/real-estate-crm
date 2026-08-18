const prisma = require("../prisma"); // Adjusted path

// GET /api/leads/unassigned
// Admin's Lead Inbox — section 4.1 of the PRD.
async function getUnassignedLeads(req, res) {
  try {
    const leads = await prisma.lead.findMany({
      where: { assignedToId: null, status: "ACTIVE" },
      orderBy: { dateReceived: "desc" },
    });
    return res.json(leads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch unassigned leads" });
  }
}

// GET /api/leads  (admin: all leads, optionally filtered)
async function getAllLeads(req, res) {
  try {
    const { salesPersonId, category, funnelStage } = req.query;

    const leads = await prisma.lead.findMany({
      where: {
        ...(salesPersonId && { assignedToId: salesPersonId }),
        ...(category && { category }),
        ...(funnelStage && { funnelStage }),
      },
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: { dateReceived: "desc" },
    });
    return res.json(leads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
}

// GET /api/leads/mine  (sales person: only their own leads — section 5.1)
async function getMyLeads(req, res) {
  try {
    const leads = await prisma.lead.findMany({
      where: { assignedToId: req.user.userId, status: "ACTIVE" },
      orderBy: { dateReceived: "desc" },
    });
    return res.json(leads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch your leads" });
  }
}

// PATCH /api/leads/:id/assign   body: { salesPersonId }
// Manual assignment — section 4.2. Updates the lead AND writes an
// audit row, per the PRD's answered Q1.
async function assignLead(req, res) {
  try {
    const { id } = req.params;
    const { salesPersonId } = req.body;

    if (!salesPersonId) {
      return res.status(400).json({ error: "salesPersonId is required" });
    }

    const salesPerson = await prisma.user.findUnique({ where: { id: salesPersonId } });
    if (!salesPerson || salesPerson.role !== "SALES_PERSON") {
      return res.status(400).json({ error: "salesPersonId must belong to a valid Sales Person" });
    }

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: { assignedToId: salesPersonId },
      }),
      prisma.leadAssignmentHistory.create({
        data: {
          leadId: id,
          assignedToId: salesPersonId,
          assignedById: req.user.userId, // the Admin making the call
        },
      }),
    ]);

    return res.json(updatedLead);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to assign lead" });
  }
}

// POST /api/leads/auto-assign
// Optional round-robin auto-assignment — section 4.2.
// Assigns ALL currently unassigned leads to active sales people,
// evenly, in turn.
async function autoAssignLeads(req, res) {
  try {
    const [unassignedLeads, activeSalesPeople] = await Promise.all([
      prisma.lead.findMany({ where: { assignedToId: null, status: "ACTIVE" } }),
      prisma.user.findMany({ where: { role: "SALES_PERSON", isActive: true } }),
    ]);

    if (activeSalesPeople.length === 0) {
      return res.status(400).json({ error: "No active sales people to assign to" });
    }

    const assignments = [];
    unassignedLeads.forEach((lead, index) => {
      const salesPerson = activeSalesPeople[index % activeSalesPeople.length];
      assignments.push(
        prisma.lead.update({
          where: { id: lead.id },
          data: { assignedToId: salesPerson.id },
        }),
        prisma.leadAssignmentHistory.create({
          data: {
            leadId: lead.id,
            assignedToId: salesPerson.id,
            assignedById: req.user.userId,
          },
        })
      );
    });

    await prisma.$transaction(assignments);

    return res.json({ assignedCount: unassignedLeads.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Auto-assignment failed" });
  }
}

// PATCH /api/leads/:id/lost
// Marks a lead as Lost/Dropped — PRD section 5.3: "A lead can also be
// marked as Lost/Dropped at any stage." Sales Person can only do this
// for their own assigned leads; Admin can do it for any lead as an override.
async function markLeadLost(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body; // optional free-text, stored in history notes if you extend it later

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Ownership check
    if (req.user.role === "SALES_PERSON" && lead.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: "You can only update leads assigned to you" });
    }
    if (req.user.role === "BROKER" && lead.brokerId !== req.user.userId) {
      return res.status(403).json({ error: "You can only update leads you referred" });
    }

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: { status: "LOST", funnelStage: "LOST" },
      }),
      prisma.leadStatusHistory.create({
        data: {
          leadId: id,
          stage: "LOST",
          changedById: req.user.userId,
        },
      }),
    ]);

    return res.json(updatedLead);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to mark lead as lost" });
  }
}

// PATCH /api/leads/:id/category   body: { category: "HOT" | "WARM" | "COLD" }
// PRD 5.2 — Sales Person marks a lead Hot/Warm/Cold. Admin can override too.
async function categorizeLead(req, res) {
  try {
    const { id } = req.params;
    const { category } = req.body;

    if (!["HOT", "WARM", "COLD"].includes(category)) {
      return res.status(400).json({ error: "category must be HOT, WARM, or COLD" });
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    if (req.user.role === "SALES_PERSON" && lead.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: "You can only update leads assigned to you" });
    }
    if (req.user.role === "BROKER" && lead.brokerId !== req.user.userId) {
      return res.status(403).json({ error: "You can only update leads you referred" });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { category },
    });

    return res.json(updatedLead);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update category" });
  }
}

// PATCH /api/leads/:id/stage   body: { stage: "INTERESTED" | "SITE_VISIT_DONE" | "DEAL_CLOSED" }
// PRD 5.3 — moves a lead through the funnel. Manual, sales-person driven.
// (Marking LOST has its own dedicated endpoint — /:id/lost — since that's
// a distinct action with its own PRD wording, not part of forward progression.)
async function updateFunnelStage(req, res) {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!["INTERESTED", "SITE_VISIT_DONE", "DEAL_CLOSED"].includes(stage)) {
      return res.status(400).json({ error: "stage must be INTERESTED, SITE_VISIT_DONE, or DEAL_CLOSED" });
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    if (req.user.role === "SALES_PERSON" && lead.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: "You can only update leads assigned to you" });
    }
    if (req.user.role === "BROKER" && lead.brokerId !== req.user.userId) {
      return res.status(403).json({ error: "You can only update leads you referred" });
    }

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: { funnelStage: stage },
      }),
      prisma.leadStatusHistory.create({
        data: {
          leadId: id,
          stage,
          changedById: req.user.userId,
        },
      }),
    ]);

    return res.json(updatedLead);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update funnel stage" });
  }
}

module.exports = {
  getUnassignedLeads,
  getAllLeads,
  getMyLeads,
  assignLead,
  autoAssignLeads,
  markLeadLost,
  categorizeLead,
  updateFunnelStage,
};
