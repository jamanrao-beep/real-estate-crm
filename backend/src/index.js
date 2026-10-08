require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const leadRoutes = require("./routes/leadRoutes");
const callRoutes = require("./routes/callRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cors = require("cors");
const compression = require("compression");
const reportRoutes = require("./routes/reportRoutes");
const brokerRoutes = require("./routes/brokerRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { startCronJobs } = require("./jobs/cronJobs");

const { seedDatabase } = require("./utils/seedDatabase");

const app = express();
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRoutes);
const { getAllUsers } = require("./controllers/authController");
const { requireAuth, adminOnly } = require("./middleware/auth");
app.get("/api/users", requireAuth, adminOnly, getAllUsers);
app.use("/webhooks", webhookRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/calls", callRoutes);
app.use("/api", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/broker", brokerRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/seed", async (req, res) => {
  const result = await seedDatabase();
  return res.json(result);
});
app.get("/api/sync-sheets", async (req, res) => {
  const { syncGoogleSheetLeads } = require("./services/googleSheetSync");
  const result = await syncGoogleSheetLeads();
  return res.json(result);
});
app.get("/api/leads/auto-assign-all", async (req, res) => {
  const { autoAssignLeads } = require("./controllers/leadController");
  return autoAssignLeads(req, res);
});

// Start background jobs & seed initial users
startCronJobs();
seedDatabase().catch((err) => console.error("Initial seed error:", err));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

// trigger restart
// restart 2
