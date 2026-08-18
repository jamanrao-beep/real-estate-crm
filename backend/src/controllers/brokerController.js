const prisma = require("../prisma");

// GET /api/broker/leads
// Channel Partner views their submitted leads
async function getMyLeads(req, res) {
  try {
    const leads = await prisma.lead.findMany({
      where: { brokerId: req.user.userId },
      orderBy: { dateReceived: "desc" },
    });
    return res.json(leads);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch your leads" });
  }
}

// POST /api/broker/leads
// Channel Partner submits a new lead
async function submitLead(req, res) {
  try {
    const { name, phone, email, source } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    const newLead = await prisma.lead.create({
      data: {
        name,
        phone,
        email,
        source: source || "Channel Partner",
        brokerId: req.user.userId,
      },
    });

    return res.status(201).json(newLead);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to submit lead" });
  }
}

module.exports = {
  getMyLeads,
  submitLead,
};
