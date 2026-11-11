import { db } from "../../config/db.js";

export const list = (req, res) => {
  const sql = `

    SELECT

      r.id,

      r.rating,

      r.comment,

      r.created_at,

      u.full_name AS author_name

    FROM marketplace_reviews r

    JOIN users u ON u.id = r.user_id

    ORDER BY r.created_at DESC, r.id DESC

  `;

  db.query(sql, (err, reviews) => {
    if (err) {
      console.error("Load reviews error:", err);

      return res.status(500).json({ message: "Could not load reviews." });
    }

    return res.json(reviews);
  });
};

export const publish = (req, res) => {
  const { rating, comment } = req.body || {};

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Choose a rating from 1 to 5." });
  }

  if (
    typeof comment !== "string" ||
    !comment.trim() ||
    comment.trim().length > 1000
  ) {
    return res.status(400).json({
      message: "Write a review between 1 and 1000 characters.",
    });
  }

  const sql = `

    INSERT INTO marketplace_reviews (user_id, rating, comment)

    VALUES (?, ?, ?)

  `;

  db.query(sql, [req.session.userId, rating, comment.trim()], (err, result) => {
    if (err) {
      console.error("Create review error:", err);

      return res

        .status(500)

        .json({ message: "Could not publish your review." });
    }

    return res.status(201).json({ id: result.insertId });
  });
};
