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
    const { category, funnelStage } = req.query;
    const leads = await prisma.lead.findMany({
      where: {
        assignedToId: req.user.userId,
        status: "ACTIVE",
        ...(category && { category }),
        ...(funnelStage && { funnelStage }),
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

    if (!["INTERESTED", "OFFICE_VISIT_DONE", "SITE_VISIT_DONE", "DEAL_CLOSED", "NOT_INTERESTED"].includes(stage)) {
      return res.status(400).json({ error: "stage must be INTERESTED, OFFICE_VISIT_DONE, SITE_VISIT_DONE, DEAL_CLOSED, or NOT_INTERESTED" });
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

    // Strictly prevent duplicate conversion / status events if already at this stage
    if (lead.funnelStage === stage) {
      return res.json(lead);
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

    // Ownership check
    if (req.user.role === "SALES_PERSON" && lead.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: "You can only update leads assigned to you" });
    }
    
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        followUpAt: followUpAt ? new Date(followUpAt) : null,
        followUpNotes: followUpAt ? (followUpNotes ? followUpNotes.trim() : null) : null,
      },
    });

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

    // Automated WhatsApp greeting disabled ("bot ka chakkar hata do")
    // const { sendChatMitraLeadGreeting } = require("../services/chatMitraService");
    // sendChatMitraLeadGreeting(newLead).catch((err) => ...);

    return res.status(201).json({ success: true, lead: newLead });
  } catch (err) {
    console.error("Webhook lead creation failed:", err);
    return res.status(500).json({ error: "Failed to create lead: " + err.message });
  }
}

// POST /api/leads/:id/send-whatsapp (Manual trigger from CRM)
async function sendWhatsAppToLead(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body; // optional custom message text

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const { sendChatMitraLeadGreeting, sendCustomWhatsAppMessage } = require("../services/chatMitraService");

    let result;
    if (message && message.trim()) {
      result = await sendCustomWhatsAppMessage(lead.phone, message.trim(), lead.id, req.user?.name || "Agent");
    } else {
      result = await sendChatMitraLeadGreeting(lead);
    }

    if (result && result.success === false) {
      const failReason = result.reason || (typeof result.error === "string" ? result.error : result.error?.message) || "Failed to deliver WhatsApp message";
      return res.status(400).json({
        error: `Failed to deliver: ${failReason}`
      });
    }

    const updatedLead = await prisma.lead.findUnique({ where: { id } });
    return res.json({ success: true, result, lead: updatedLead });
  } catch (err) {
    console.error("Failed to send WhatsApp message:", err);
    return res.status(500).json({ error: "Failed to send WhatsApp message: " + err.message });
  }
}

// POST /api/leads/import-bulk (Bulk upload 500-1000+ leads from Excel / CSV)
async function importBulkLeads(req, res) {
  try {
    const { leads, defaultSource, sendGreetings } = req.body;

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

      // If user selected to send automated greetings to imported leads
      if (sendGreetings) {
        const { sendChatMitraLeadGreeting } = require("../services/chatMitraService");
        // Dispatch greetings in background with a slight delay between each
        (async () => {
          for (const lead of newLeadsToInsert) {
            await sendChatMitraLeadGreeting(lead).catch(() => {});
            await new Promise(r => setTimeout(r, 200));
          }
        })();
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

    // Automatically send WhatsApp greeting to the new lead
    const { sendChatMitraLeadGreeting } = require("../services/chatMitraService");
    sendChatMitraLeadGreeting(newLead).catch((err) => {
      console.error("[LeadController] Automated WhatsApp greeting error:", err);
    });

    return res.status(201).json(newLead);
  } catch (err) {
    console.error("Failed to create lead:", err);
    return res.status(500).json({ error: "Failed to create lead: " + err.message });
  }
}

module.exports = {
  createLead,
  getUnassignedLeads,
  getAllLeads,
  getMyLeads,
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
  sendWhatsAppToLead,
};
