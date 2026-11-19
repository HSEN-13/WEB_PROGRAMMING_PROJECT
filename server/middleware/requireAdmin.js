import { db } from "../config/db.js";

export default async function requireAdmin(req, res, next) {
  res.set("Cache-Control", "private, no-store");

  if (!req.session.userId) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const [rows] = await db
      .promise()
      .execute("SELECT role FROM users WHERE id = ?", [req.session.userId]);

    if (rows[0]?.role !== "admin") {
      return res.status(403).json({ message: "Admin access is required." });
    }
  } catch (error) {
    console.error("Admin permission check failed:", error);
    return res.status(500).json({ message: "Could not verify admin access." });
  }

  next();
}
