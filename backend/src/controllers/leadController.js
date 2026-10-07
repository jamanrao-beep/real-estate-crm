const prisma = require("../prisma"); // Adjusted path
const { recordLeadAction } = require("../utils/auditLogger");

const standardLeadInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
  callLogs: {
    orderBy: { createdAt: "desc" },
    select: { id: true, notes: true, createdAt: true, salesPersonId: true, durationSecs: true },
  },
  statusHistory: {
    orderBy: { changedAt: "desc" },
    select: { id: true, stage: true, changedAt: true, changedById: true },
  },
  assignmentHistory: {
    orderBy: { assignedAt: "desc" },
    select: { assignedAt: true, assignedToId: true, assignedById: true },
  },
};

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
    const { salesPersonId, category, funnelStage, project, source } = req.query;

    const projectFilter = project ? [
      { source: { contains: project, mode: "insensitive" } },
      ...(project.toLowerCase().includes("rani") ? [
        { source: { contains: "ranipokhari", mode: "insensitive" } },
        { source: { contains: "rani pokhari", mode: "insensitive" } },
        { source: { contains: "rani", mode: "insensitive" } }
      ] : []),
      ...(project.toLowerCase().includes("fun") ? [
        { source: { contains: "fun valley", mode: "insensitive" } },
        { source: { contains: "funvalley", mode: "insensitive" } }
      ] : []),
      ...(project.toLowerCase().includes("sahastra") ? [
        { source: { contains: "sahastradhara", mode: "insensitive" } },
        { source: { contains: "sahastra dhara", mode: "insensitive" } },
        { source: { contains: "sd project", mode: "insensitive" } }
      ] : []),
      ...(project.toLowerCase().includes("thano") ? [
        { source: { contains: "thano", mode: "insensitive" } }
      ] : [])
    ] : null;

    const leads = await prisma.lead.findMany({
      where: {
        ...(salesPersonId && { assignedToId: salesPersonId }),
        ...(category && { category }),
        ...(funnelStage && { funnelStage }),
        ...(source && { source: { contains: source, mode: "insensitive" } }),
        ...(projectFilter && { OR: projectFilter }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        callLogs: {
          orderBy: { createdAt: "desc" },
          select: { id: true, notes: true, createdAt: true, salesPersonId: true },
        },
        statusHistory: {
          orderBy: { changedAt: "desc" },
          select: { id: true, stage: true, changedAt: true, changedById: true },
        },
        assignmentHistory: {
          orderBy: { assignedAt: "desc" },
          select: { assignedAt: true, assignedToId: true, assignedById: true },
        },
      },
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
    const { category, funnelStage, project, source } = req.query;

    const projectFilter = project ? [
      { source: { contains: project, mode: "insensitive" } },
      ...(project.toLowerCase().includes("rani") ? [
        { source: { contains: "ranipokhari", mode: "insensitive" } },
        { source: { contains: "rani pokhari", mode: "insensitive" } },
        { source: { contains: "rani", mode: "insensitive" } }
      ] : []),
      ...(project.toLowerCase().includes("fun") ? [
        { source: { contains: "fun valley", mode: "insensitive" } },
        { source: { contains: "funvalley", mode: "insensitive" } }
      ] : []),
      ...(project.toLowerCase().includes("sahastra") ? [
        { source: { contains: "sahastradhara", mode: "insensitive" } },
        { source: { contains: "sahastra dhara", mode: "insensitive" } },
        { source: { contains: "sd project", mode: "insensitive" } }
      ] : []),
      ...(project.toLowerCase().includes("thano") ? [
        { source: { contains: "thano", mode: "insensitive" } }
      ] : [])
    ] : null;

    const leads = await prisma.lead.findMany({
      where: {
        assignedToId: req.user.userId,
        status: "ACTIVE",
        ...(category && { category }),
        ...(funnelStage && { funnelStage }),
        ...(source && { source: { contains: source, mode: "insensitive" } }),
        ...(projectFilter && { OR: projectFilter }),
      },
      include: {
        callLogs: {
          orderBy: { createdAt: "desc" },
          select: { id: true, notes: true, createdAt: true, salesPersonId: true },
        },
        statusHistory: {
          orderBy: { changedAt: "desc" },
          select: { id: true, stage: true, changedAt: true, changedById: true },
        },
        assignmentHistory: {
          where: { assignedToId: req.user.userId },
          orderBy: { assignedAt: "desc" },
          select: { assignedAt: true, assignedToId: true, assignedById: true },
        },
      },
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
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
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
// High-performance round-robin auto-assignment for large volumes (1,000+ leads)
// Accepts optional body: { salesPersonIds?: string[] }
async function autoAssignLeads(req, res) {
  try {
    const { salesPersonIds } = req.body || {};

    const [unassignedLeads, allSalesPeople] = await Promise.all([
      prisma.lead.findMany({ 
        where: { assignedToId: null, status: "ACTIVE" },
        select: { id: true },
        orderBy: { dateReceived: "desc" }
      }),
      prisma.user.findMany({ 
        where: { role: "SALES_PERSON" },
        select: { id: true, name: true, isActive: true },
        orderBy: { name: "asc" }
      }),
    ]);

    if (unassignedLeads.length === 0) {
      return res.json({ assignedCount: 0, message: "No unassigned leads found in the inbox" });
    }

    // Determine target sales people:
    // If specific salesPersonIds passed in request, filter by them
    // Otherwise filter by isActive: true
    let targetSalesPeople = [];
    if (Array.isArray(salesPersonIds) && salesPersonIds.length > 0) {
      const idSet = new Set(salesPersonIds);
      targetSalesPeople = allSalesPeople.filter(sp => idSet.has(sp.id));
    } else {
      targetSalesPeople = allSalesPeople.filter(sp => sp.isActive);
    }

    if (targetSalesPeople.length === 0) {
      return res.status(400).json({ 
        error: "No active or selected sales people available to receive leads. Please enable at least 1 sales executive." 
      });
    }

    // Group lead IDs by sales person for bulk updateMany
    const salesPersonLeadsMap = new Map();
    targetSalesPeople.forEach(sp => salesPersonLeadsMap.set(sp.id, []));

    let adminId = req.user?.userId || req.user?.id;
    if (adminId) {
      const userExists = await prisma.user.findUnique({ where: { id: adminId }, select: { id: true } });
      if (!userExists) adminId = null;
    }
    if (!adminId) {
      const fallbackAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
      adminId = fallbackAdmin?.id || targetSalesPeople[0]?.id;
    }

    const historyRows = [];
    unassignedLeads.forEach((lead, index) => {
      const salesPerson = targetSalesPeople[index % targetSalesPeople.length];
      salesPersonLeadsMap.get(salesPerson.id).push(lead.id);
      historyRows.push({
        leadId: lead.id,
        assignedToId: salesPerson.id,
        assignedById: adminId,
      });
    });

    // 1. Bulk update leads for each sales person (1 fast query per sales rep)
    for (const [salesPersonId, leadIds] of salesPersonLeadsMap.entries()) {
      if (leadIds.length === 0) continue;
      // Chunk in 500s for safety
      for (let i = 0; i < leadIds.length; i += 500) {
        const chunk = leadIds.slice(i, i + 500);
        await prisma.lead.updateMany({
          where: { id: { in: chunk } },
          data: { assignedToId: salesPersonId },
        });
      }
    }

    // 2. Bulk insert assignment history records (chunked into 500s)
    for (let i = 0; i < historyRows.length; i += 500) {
      const chunk = historyRows.slice(i, i + 500);
      await prisma.leadAssignmentHistory.createMany({
        data: chunk,
      }).catch(err => console.error("Failed to log assignment history chunk:", err.message));
    }

    const repNames = targetSalesPeople.map(sp => sp.name).join(", ");

    return res.json({ 
      assignedCount: unassignedLeads.length,
      assignedRepsCount: targetSalesPeople.length,
      assignedReps: repNames,
      message: `Successfully distributed ${unassignedLeads.length} leads across ${targetSalesPeople.length} executives: ${repNames}!`
    });
  } catch (err) {
    console.error("Auto-assignment failed:", err);
    return res.status(500).json({ error: "Auto-assignment failed: " + err.message });
  }
}

// Helper to enforce strict lead access control:
// Only Admin and the assigned Sales Person (or referring Broker) can view/modify
function checkLeadAccess(req, lead) {
  if (req.user.role === "ADMIN") return { allowed: true };
  if (req.user.role === "SALES_PERSON") {
    if (lead.assignedToId && lead.assignedToId === req.user.userId) {
      return { allowed: true };
    }
    return { allowed: false, message: "Access denied: This lead is not assigned to you" };
  }
  if (req.user.role === "BROKER") {
    if (lead.brokerId && lead.brokerId === req.user.userId) {
      return { allowed: true };
    }
    return { allowed: false, message: "Access denied: This lead was not referred by you" };
  }
  return { allowed: false, message: "Access denied" };
}

// PATCH /api/leads/:id/lost
// Marks a lead as Lost/Dropped — PRD section 5.3: "A lead can also be
// marked as Lost/Dropped at any stage." Sales Person can only do this
// for their own assigned leads; Admin can do it for any lead as an override.
async function markLeadLost(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {}; // optional free-text, stored in history notes if you extend it later

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const access = checkLeadAccess(req, lead);
    if (!access.allowed) {
      return res.status(403).json({ error: access.message });
    }

    const updateData = {
      status: "LOST",
      funnelStage: "LOST",
    };

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: updateData,
        include: standardLeadInclude,
      }),
      prisma.leadStatusHistory.create({
        data: {
          leadId: id,
          stage: "LOST",
          changedById: req.user.userId,
        },
      }),
    ]);

    // Record permanent audit entry
    await recordLeadAction({
      leadId: id,
      userId: req.user.userId,
      action: "LEAD_MARKED_LOST",
      details: `Lead marked as LOST. Reason: "${reason ? String(reason).trim() : "No reason provided"}"`,
    });

    return res.json(updatedLead);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to mark lead as lost" });
  }
}

// PATCH /api/leads/:id/category   body: { category: "CALL_PICKED" | "CALL_NOT_PICKED" | "HOT" | "WARM" | "COLD" }
// PRD 5.2 — Sales Person marks a lead Call Picked / Call Not Picked.
async function categorizeLead(req, res) {
  try {
    const { id } = req.params;
    const { category } = req.body;

    const ALLOWED_CATEGORIES = ["CALL_PICKED", "CALL_NOT_PICKED", "HOT", "WARM", "COLD"];
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "category must be CALL_PICKED or CALL_NOT_PICKED" });
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const access = checkLeadAccess(req, lead);
    if (!access.allowed) {
      return res.status(403).json({ error: access.message });
    }

    // Category rule:
    // If CALL_NOT_PICKED -> Stage must be CALLBACK
    // If CALL_PICKED and previous stage was CALLBACK/CALL_NOT_PICKED -> switch to FOLLOW_UP
    let newStage = undefined;
    if (category === "CALL_NOT_PICKED") {
      newStage = "CALLBACK";
    } else if (category === "CALL_PICKED" && (lead.funnelStage === "CALLBACK" || lead.funnelStage === "CALL_NOT_PICKED")) {
      newStage = "FOLLOW_UP";
    }

    const updateData = {
      category,
    };
    if (newStage) {
      updateData.funnelStage = newStage;
    }

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: updateData,
        include: standardLeadInclude,
      }),
      ...(newStage && newStage !== lead.funnelStage ? [
        prisma.leadStatusHistory.create({
          data: {
            leadId: id,
            stage: newStage,
            changedById: req.user.userId,
          },
        }),
      ] : []),
    ]);

    // Record permanent audit entry with timestamp
    await recordLeadAction({
      leadId: id,
      userId: req.user.userId,
      action: "CATEGORY_CHANGED",
      details: `Category changed from "${lead.category}" to "${category}"${newStage ? ` (Stage updated to "${newStage}")` : ""}`,
    });

    return res.json(updatedLead);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update category" });
  }
}

// PATCH /api/leads/:id/stage   body: { stage: string }
// PRD 5.3 — moves a lead through the funnel. Manual, sales-person driven.
async function updateFunnelStage(req, res) {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const ALLOWED_STAGES = [
      "CALLBACK",
      "FOLLOW_UP",
      "INTERESTED",
      "NOT_INTERESTED",
      "DETAILS_SHARED",
      "SITE_VISIT_DONE",
      "OFFICE_VISIT_DONE",
      "BOOKING_DONE",
      "DEAL_CLOSED",
      "CALL_NOT_PICKED",
    ];

    if (!ALLOWED_STAGES.includes(stage)) {
      return res.status(400).json({ error: `Invalid stage: ${stage}` });
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const access = checkLeadAccess(req, lead);
    if (!access.allowed) {
      return res.status(403).json({ error: access.message });
    }

    // Strictly prevent duplicate conversion / status events if already at this stage
    if (lead.funnelStage === stage) {
      return res.json(lead);
    }

    // Enforce Category & Stage relationship:
    // If stage is CALLBACK -> category is CALL_NOT_PICKED
    // If stage is a Call Picked stage -> category is CALL_PICKED
    let newCategory = lead.category;
    if (stage === "CALLBACK") {
      newCategory = "CALL_NOT_PICKED";
    } else if (["FOLLOW_UP", "INTERESTED", "NOT_INTERESTED", "DETAILS_SHARED", "SITE_VISIT_DONE", "OFFICE_VISIT_DONE", "BOOKING_DONE", "DEAL_CLOSED"].includes(stage)) {
      newCategory = "CALL_PICKED";
    }

    const updateData = {
      funnelStage: stage,
    };
    if (newCategory && newCategory !== lead.category) {
      updateData.category = newCategory;
    }

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: updateData,
        include: standardLeadInclude,
      }),
      prisma.leadStatusHistory.create({
        data: {
          leadId: id,
          stage,
          changedById: req.user.userId,
        },
      }),
    ]);

    // Record permanent audit entry with timestamp
    await recordLeadAction({
      leadId: id,
      userId: req.user.userId,
      action: "STAGE_CHANGED",
      details: `Funnel stage changed from "${lead.funnelStage}" to "${stage}"${newCategory && newCategory !== lead.category ? ` (Category set to "${newCategory}")` : ""}`,
    });

    if (stage === "DEAL_CLOSED") {
      const actor = await prisma.user.findUnique({ where: { id: req.user.userId } });
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      const message = `Deal Closed: ${actor?.name || "A team member"} has finalized a deal with ${updatedLead.name}.`;
      
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            message,
          })),
        });
      }
    }

    return res.json(updatedLead);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update funnel stage" });
  }
}

// PATCH /api/leads/:id/ai-chat
async function logAiChatMessage(req, res) {
  try {
    const { id } = req.params;
    const { message, sender } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // Ensure it's an array
    const chatHistory = Array.isArray(lead.aiChatHistory) ? lead.aiChatHistory : [];
    chatHistory.push({
      sender: sender || "bot",
      message,
      timestamp: new Date().toISOString(),
    });

    const updated = await prisma.lead.update({
      where: { id },
      data: { aiChatHistory: chatHistory },
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to log AI chat message" });
  }
}

// PATCH /api/leads/:id/follow-up
async function scheduleFollowUp(req, res) {
  try {
    const { id } = req.params;
    const { followUpAt, followUpNotes } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const access = checkLeadAccess(req, lead);
    if (!access.allowed) {
      return res.status(403).json({ error: access.message });
    }

    const newFollowUpDate = followUpAt ? new Date(followUpAt) : null;
    const newFollowUpNotes = followUpNotes !== undefined ? (followUpNotes ? followUpNotes.trim() : null) : lead.followUpNotes;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        followUpAt: newFollowUpDate,
        followUpNotes: newFollowUpNotes,
      },
      include: standardLeadInclude,
    });

    if (newFollowUpDate) {
      const istFollowUp = newFollowUpDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      await recordLeadAction({
        leadId: id,
        userId: req.user.userId,
        action: "FOLLOW_UP_SCHEDULED",
        details: `Scheduled follow-up for ${istFollowUp}${newFollowUpNotes ? ` | Note: "${newFollowUpNotes}"` : ""}`,
      });
    } else {
      await recordLeadAction({
        leadId: id,
        userId: req.user.userId,
        action: "FOLLOW_UP_CLEARED",
        details: `Follow-up dismissed/cleared`,
      });
    }

    return res.json(updatedLead);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to schedule follow-up" });
  }
}

// POST /api/leads/sync-sheet (Trigger manual Google Sheet sync)
async function syncSheetLeads(req, res) {
  try {
    const { syncGoogleSheetLeads } = require("../services/googleSheetSync");
    const result = await syncGoogleSheetLeads();
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("Failed to sync sheet leads:", err);
    return res.status(500).json({ error: "Failed to sync Google Sheet leads: " + err.message });
  }
}

// POST /api/leads/webhook (Instant push from Google Apps Script / Zapier / Website)
async function receiveWebhookLead(req, res) {
  try {
    const { name, phone, email, source, notes, formAnswers } = req.body;

    if (!phone && !name) {
      return res.status(400).json({ error: "Name or phone number is required" });
    }

    const cleanPhone = phone ? String(phone).replace(/^p:/i, "").trim() : "";

    // Check duplicate
    if (cleanPhone) {
      const existing = await prisma.lead.findFirst({ where: { phone: cleanPhone } });
      if (existing) {
        return res.status(200).json({ success: true, message: "Lead already exists", lead: existing });
      }
    }

    const newLead = await prisma.lead.create({
      data: {
        name: name || (cleanPhone ? `Lead (${cleanPhone})` : "New Webhook Lead"),
        phone: cleanPhone || "N/A",
        email: email || "",
        source: source || "Google Sheet / Webhook",
        formAnswers: formAnswers || { notes: notes || null },
        status: "ACTIVE",
        dateReceived: new Date()
      }
    });

    console.log(`[Webhook] Created new lead: ${newLead.name} (${newLead.phone})`);

    return res.status(201).json({ success: true, lead: newLead });
  } catch (err) {
    console.error("Webhook lead creation failed:", err);
    return res.status(500).json({ error: "Failed to create lead: " + err.message });
  }
}

// POST /api/leads/import-bulk (Bulk upload 500-1000+ leads from Excel / CSV)
async function importBulkLeads(req, res) {
  try {
    const { leads, defaultSource } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: "No leads provided for import" });
    }

    // 1. Fetch existing phone numbers in DB to prevent duplicates
    const existingLeads = await prisma.lead.findMany({
      select: { phone: true, email: true }
    });

    const normalizePhone10 = (p) => {
      if (!p) return "";
      const digits = String(p).replace(/[^\d]/g, "");
      return digits.length >= 10 ? digits.slice(-10) : digits;
    };

    const existingPhones = new Set();
    const existingEmails = new Set();

    existingLeads.forEach(l => {
      const p10 = normalizePhone10(l.phone);
      if (p10) existingPhones.add(p10);
      if (l.email && l.email.includes("@")) existingEmails.add(l.email.toLowerCase().trim());
    });

    const newLeadsToInsert = [];
    let duplicateCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < leads.length; i++) {
      const item = leads[i];
      let name = item.name ? String(item.name).trim() : "";
      let rawPhone = item.phone ? String(item.phone).trim() : "";
      let rawEmail = item.email ? String(item.email).trim() : "";
      let source = item.source ? String(item.source).trim() : (defaultSource || "Excel Import");
      let notes = item.notes ? String(item.notes).trim() : null;

      // Clean phone: remove 'p:', spaces, special chars except digits and plus
      let phone = rawPhone.replace(/^p:/i, "").replace(/[^\d+]/g, "").trim();

      if (!phone && !name && !rawEmail) {
        skippedCount++;
        continue;
      }

      if (!name) {
        name = phone ? `Lead (${phone})` : `Lead #${i + 1}`;
      }

      const p10 = normalizePhone10(phone);
      const emailLower = rawEmail.includes("@") ? rawEmail.toLowerCase().trim() : "";

      // Check duplicates
      const isPlaceholderEmail = !emailLower || ["none@", "noemail@", "na@", "test@", "info@"].some(p => emailLower.startsWith(p));

      if (p10 && existingPhones.has(p10)) {
        duplicateCount++;
        continue;
      }
      if (emailLower && !isPlaceholderEmail && existingEmails.has(emailLower)) {
        duplicateCount++;
        continue;
      }

      if (p10) existingPhones.add(p10);
      if (emailLower && !isPlaceholderEmail) existingEmails.add(emailLower);

      let parsedDate = item.dateReceived ? new Date(item.dateReceived) : new Date();
      if (isNaN(parsedDate.getTime())) parsedDate = new Date();

      newLeadsToInsert.push({
        name: name.slice(0, 250),
        phone: (phone || "N/A").slice(0, 50),
        email: emailLower.slice(0, 250),
        source: (source || "Excel Import").slice(0, 200),
        category: "WARM",
        funnelStage: "INTERESTED",
        formAnswers: {
          importedFrom: "Excel/CSV",
          notes: notes ? String(notes).slice(0, 1000) : null
        },
        status: "ACTIVE",
        dateReceived: parsedDate,
      });
    }

    if (newLeadsToInsert.length > 0) {
      // Chunk insertions into batches of 100 for maximum performance with Neon DB
      const batchSize = 100;
      for (let i = 0; i < newLeadsToInsert.length; i += batchSize) {
        const chunk = newLeadsToInsert.slice(i, i + batchSize);
        try {
          await prisma.lead.createMany({
            data: chunk
          });
        } catch (batchErr) {
          console.warn(`[Bulk Import] Batch failed (${batchErr.message}), falling back to individual inserts`);
          for (const leadItem of chunk) {
            try {
              await prisma.lead.create({
                data: leadItem
              });
            } catch (singleErr) {
              console.error(`[Bulk Import] Skipped problematic row (${leadItem.name}):`, singleErr.message);
              skippedCount++;
            }
          }
        }
      }
    }

    const actualImported = Math.max(0, newLeadsToInsert.length - skippedCount);

    return res.json({
      success: true,
      importedCount: actualImported,
      duplicateCount,
      skippedCount,
      totalCount: leads.length,
      message: `Successfully imported ${actualImported} new leads (${duplicateCount} duplicates skipped)!`
    });
  } catch (err) {
    console.error("Bulk import failed:", err);
    return res.status(500).json({ error: "Failed to import leads: " + err.message });
  }
}

// POST /api/leads (Manual / Test Lead Creation)
async function createLead(req, res) {
  try {
    const { name, phone, email, source, notes, assignedToId, category, funnelStage } = req.body;

    if (!name && !phone) {
      return res.status(400).json({ error: "Name or Phone is required" });
    }

    const cleanPhone = phone ? String(phone).replace(/^p:/i, "").replace(/[^\d+]/g, "").trim() : "";

    // Check duplicate
    if (cleanPhone && cleanPhone !== "N/A") {
      const existing = await prisma.lead.findFirst({ where: { phone: cleanPhone } });
      if (existing) {
        return res.status(400).json({ error: "A lead with this phone number already exists", lead: existing });
      }
    }

    let assignedId = assignedToId || null;
    if (req.user.role === "SALES_PERSON" && !assignedId) {
      assignedId = req.user.userId;
    }

    const newLead = await prisma.lead.create({
      data: {
        name: name || (cleanPhone ? `Lead (${cleanPhone})` : "New Lead"),
        phone: cleanPhone || "N/A",
        email: email || "",
        source: source || "Manual Entry",
        formAnswers: notes ? { notes } : undefined,
        category: category || "WARM",
        funnelStage: funnelStage || "INTERESTED",
        status: "ACTIVE",
        assignedToId: assignedId,
        dateReceived: new Date(),
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (assignedId) {
      await prisma.leadAssignmentHistory.create({
        data: {
          leadId: newLead.id,
          assignedToId: assignedId,
          assignedById: req.user.userId,
        },
      });
    }

    return res.status(201).json(newLead);
  } catch (err) {
    console.error("Failed to create lead:", err);
    return res.status(500).json({ error: "Failed to create lead: " + err.message });
  }
}

// POST /api/leads/:id/notes   body: { note: string }
async function addLeadNote(req, res) {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: "Note cannot be empty" });
    }

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const access = checkLeadAccess(req, lead);
    if (!access.allowed) {
      return res.status(403).json({ error: access.message });
    }

    const cleanNote = note.trim();

    // 1. Create CallLog record for note audit/history
    const callLog = await prisma.callLog.create({
      data: {
        leadId: id,
        salesPersonId: req.user.userId,
        startTime: new Date(),
        endTime: new Date(),
        durationSecs: 0,
        notes: cleanNote,
      },
    });

    // 2. Also record permanent audit action with timestamp
    await recordLeadAction({
      leadId: id,
      userId: req.user.userId,
      action: "NOTE_ADDED",
      details: `Added note: "${cleanNote}"`,
    });

    // 3. Update lead's formAnswers.callNotes
    const currentFormAnswers = (lead.formAnswers && typeof lead.formAnswers === "object") ? { ...lead.formAnswers } : {};
    currentFormAnswers.callNotes = cleanNote;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        formAnswers: currentFormAnswers,
      },
      include: standardLeadInclude,
    });

    return res.status(201).json({ success: true, callLog, lead: updatedLead });
  } catch (err) {
    console.error("Failed to add note:", err);
    return res.status(500).json({ error: "Failed to add note" });
  }
}

// PATCH /api/leads/:id/notes   body: { noteId?: string, oldNote?: string, newNote: string }
async function updateLeadNote(req, res) {
  try {
    const { id } = req.params;
    const { noteId, oldNote, newNote } = req.body;

    if (!newNote || !newNote.trim()) {
      return res.status(400).json({ error: "New note cannot be empty" });
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        callLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const access = checkLeadAccess(req, lead);
    if (!access.allowed) {
      return res.status(403).json({ error: access.message });
    }

    const cleanNewNote = newNote.trim();
    let callLogUpdated = null;

    // Prevent modifying system audit logs directly
    if (noteId && !noteId.startsWith("temp-") && noteId !== "formAnswers") {
      const existingCallLog = lead.callLogs.find((cl) => cl.id === noteId);
      if (existingCallLog) {
        if (existingCallLog.notes && existingCallLog.notes.startsWith("[AUDIT:")) {
          return res.status(403).json({ error: "Audit logs cannot be modified" });
        }
        callLogUpdated = await prisma.callLog.update({
          where: { id: noteId },
          data: { notes: cleanNewNote },
        });
      }
    }

    // 2. If no callLogUpdated yet, but oldNote is provided, find call log with matching text
    if (!callLogUpdated && oldNote) {
      const match = lead.callLogs.find((cl) => cl.notes && cl.notes.trim() === oldNote.trim() && !cl.notes.startsWith("[AUDIT:"));
      if (match) {
        callLogUpdated = await prisma.callLog.update({
          where: { id: match.id },
          data: { notes: cleanNewNote },
        });
      }
    }

    // Record permanent audit entry of the edit!
    await recordLeadAction({
      leadId: id,
      userId: req.user.userId,
      action: "NOTE_EDITED",
      details: `Edited note from "${oldNote || "previous text"}" to "${cleanNewNote}"`,
    });

    // 3. Update lead formAnswers.callNotes if it was matching oldNote or is the latest note
    const currentFormAnswers = (lead.formAnswers && typeof lead.formAnswers === "object") ? { ...lead.formAnswers } : {};
    if (
      !oldNote ||
      (currentFormAnswers.callNotes && currentFormAnswers.callNotes.trim() === (oldNote || "").trim()) ||
      noteId === "formAnswers" ||
      !lead.callLogs.length ||
      (callLogUpdated && lead.callLogs[0]?.id === callLogUpdated.id)
    ) {
      currentFormAnswers.callNotes = cleanNewNote;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        formAnswers: currentFormAnswers,
      },
      include: standardLeadInclude,
    });

    return res.json({ success: true, lead: updatedLead, callLog: callLogUpdated });
  } catch (err) {
    console.error("Failed to update note:", err);
    return res.status(500).json({ error: "Failed to update note" });
  }
}

// DELETE /api/leads/:id/notes   body: { noteId?: string, note?: string }
async function deleteLeadNote(req, res) {
  try {
    const { id } = req.params;
    const { noteId, note } = req.body;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { callLogs: true },
    });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const access = checkLeadAccess(req, lead);
    if (!access.allowed) {
      return res.status(403).json({ error: access.message });
    }

    let deletedContent = note || "";

    if (noteId && !noteId.startsWith("temp-") && noteId !== "formAnswers") {
      const target = lead.callLogs.find((cl) => cl.id === noteId);
      if (target?.notes?.startsWith("[AUDIT:")) {
        return res.status(403).json({ error: "Audit logs cannot be deleted" });
      }
      if (target?.notes) deletedContent = target.notes;
      await prisma.callLog.deleteMany({ where: { id: noteId, leadId: id } });
    } else if (note) {
      const match = lead.callLogs.find((cl) => cl.notes && cl.notes.trim() === note.trim() && !cl.notes.startsWith("[AUDIT:"));
      if (match) {
        deletedContent = match.notes;
        await prisma.callLog.delete({ where: { id: match.id } });
      }
    }

    // Record permanent audit entry of the deletion!
    await recordLeadAction({
      leadId: id,
      userId: req.user.userId,
      action: "NOTE_DELETED",
      details: `Deleted note content: "${deletedContent}"`,
    });

    const currentFormAnswers = (lead.formAnswers && typeof lead.formAnswers === "object") ? { ...lead.formAnswers } : {};
    if (currentFormAnswers.callNotes && (!note || currentFormAnswers.callNotes.trim() === note.trim())) {
      delete currentFormAnswers.callNotes;
      await prisma.lead.update({
        where: { id },
        data: { formAnswers: currentFormAnswers },
      });
    }

    const updatedLead = await prisma.lead.findUnique({
      where: { id },
      include: standardLeadInclude,
    });

    return res.json({ success: true, lead: updatedLead });
  } catch (err) {
    console.error("Failed to delete note:", err);
    return res.status(500).json({ error: "Failed to delete note" });
  }
}

// GET /api/leads/:id (Single Lead Detail with strict ownership enforcement)
async function getLeadById(req, res) {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: standardLeadInclude,
    });

    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const access = checkLeadAccess(req, lead);
    if (!access.allowed) {
      return res.status(403).json({ error: access.message });
    }

    return res.json(lead);
  } catch (err) {
    console.error("Failed to fetch lead:", err);
    return res.status(500).json({ error: "Failed to fetch lead" });
  }
}

// Helper for IST date string (YYYY-MM-DD)
function toISTDateString(d) {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateObj);
}

// GET /api/leads/follow-ups (Dedicated Today's Follow-ups Workspace)
async function getTodayFollowUps(req, res) {
  try {
    const { date, status, salesPersonId, search } = req.query;
    const now = new Date();
    const todayIST = toISTDateString(now);

    // Ownership filter: Sales reps only see their own; Admin sees all or filtered by salesPersonId
    const isSalesPerson = req.user.role === "SALES_PERSON";
    const targetUserId = isSalesPerson ? req.user.userId : (salesPersonId || undefined);

    const leads = await prisma.lead.findMany({
      where: {
        status: "ACTIVE",
        followUpAt: { not: null },
        ...(targetUserId && { assignedToId: targetUserId }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { followUpNotes: { contains: search } },
          ],
        }),
      },
      include: standardLeadInclude,
      orderBy: { followUpAt: "asc" },
    });

    // Compute status for each lead
    const enrichedLeads = leads.map((lead) => {
      const followUpDateObj = new Date(lead.followUpAt);
      const followUpIST = toISTDateString(followUpDateObj);
      const isToday = followUpIST === todayIST;
      const isPastDay = followUpIST < todayIST;

      // Check if call was logged today (or on followUp date)
      const hasCallLogged = Array.isArray(lead.callLogs) && lead.callLogs.some((cl) => {
        if (!cl.createdAt) return false;
        if (cl.notes && cl.notes.startsWith("[AUDIT:")) return false;
        const callIST = toISTDateString(cl.createdAt);
        return callIST === followUpIST || new Date(cl.createdAt) >= followUpDateObj;
      });

      let followUpStatus = "UPCOMING";
      if (hasCallLogged) {
        followUpStatus = "COMPLETED";
      } else if (followUpDateObj.getTime() < now.getTime()) {
        followUpStatus = "OVERDUE";
      }

      return {
        ...lead,
        isToday,
        isPastDay,
        followUpStatus,
      };
    });

    // Calculate summary statistics
    const totalToday = enrichedLeads.filter((l) => l.isToday).length;
    const completedToday = enrichedLeads.filter((l) => l.isToday && l.followUpStatus === "COMPLETED").length;
    const overdueToday = enrichedLeads.filter((l) => l.isToday && l.followUpStatus === "OVERDUE").length;
    const upcomingToday = enrichedLeads.filter((l) => l.isToday && l.followUpStatus === "UPCOMING").length;
    const allOverdue = enrichedLeads.filter((l) => l.followUpStatus === "OVERDUE").length;

    // Filter according to request status/date
    let filtered = enrichedLeads;
    if (status === "COMPLETED") {
      filtered = enrichedLeads.filter((l) => l.followUpStatus === "COMPLETED" && (date === "all" ? true : l.isToday));
    } else if (status === "OVERDUE") {
      filtered = enrichedLeads.filter((l) => l.followUpStatus === "OVERDUE" && (date === "all" ? true : l.isToday));
    } else if (status === "UPCOMING") {
      filtered = enrichedLeads.filter((l) => l.followUpStatus === "UPCOMING" && (date === "all" ? true : l.isToday));
    } else if (status === "ALL_PENDING") {
      filtered = enrichedLeads.filter((l) => l.followUpStatus !== "COMPLETED");
    } else if (status === "ALL_OVERDUE") {
      filtered = enrichedLeads.filter((l) => l.followUpStatus === "OVERDUE");
    } else {
      // Default: Today's follow-ups
      if (date !== "all") {
        filtered = enrichedLeads.filter((l) => l.isToday);
      }
    }

    return res.json({
      leads: filtered,
      summary: {
        totalToday,
        completedToday,
        overdueToday,
        upcomingToday,
        allOverdue,
        todayIST,
      },
    });
  } catch (err) {
    console.error("Failed to fetch follow-ups:", err);
    return res.status(500).json({ error: "Failed to fetch follow-ups: " + err.message });
  }
}

module.exports = {
  createLead,
  getUnassignedLeads,
  getAllLeads,
  getMyLeads,
  getLeadById,
  getTodayFollowUps,
  assignLead,
  autoAssignLeads,
  markLeadLost,
  categorizeLead,
  updateFunnelStage,
  logAiChatMessage,
  scheduleFollowUp,
  syncSheetLeads,
  receiveWebhookLead,
  importBulkLeads,
  addLeadNote,
  updateLeadNote,
  deleteLeadNote,
};

