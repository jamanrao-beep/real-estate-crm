require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const leadRoutes = require("./routes/leadRoutes");
const callRoutes = require("./routes/callRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cors = require("cors");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/calls", callRoutes);
app.use("/api", paymentRoutes);
app.use("/api/reports", reportRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
