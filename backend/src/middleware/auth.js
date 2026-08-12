const jwt = require("jsonwebtoken");

// Checks the request has a valid token and attaches the user info
// (id + role) to req.user so later handlers know who's asking.
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization; // expects "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Use after requireAuth on any route only Admins should reach,
// e.g. lead distribution, performance dashboards.
function adminOnly(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// Use after requireAuth on Sales Person routes, e.g. logging a call.
function salesOnly(req, res, next) {
  if (req.user?.role !== "SALES_PERSON") {
    return res.status(403).json({ error: "Sales Person access required" });
  }
  next();
}

module.exports = { requireAuth, adminOnly, salesOnly };
