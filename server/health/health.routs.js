import { Router } from "express";

import { db } from "../config/db.js";

const router = Router();

router.get("/api/test-db", (req, res) => {
  const sql = "SELECT COUNT(*) AS total FROM users";

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    res.json({
      message: "Database connected successfully!",

      totalUsers: result[0].total,
    });
  });
});

export default router;
