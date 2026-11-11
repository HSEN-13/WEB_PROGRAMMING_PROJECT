import connectDB, { db } from "../../config/db.js";

export const create = (req, res) => {
  const productId = Number(req.params.id);

  const buyerId = req.session.userId;

  const amount = req.body?.amount;

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product ID." });
  } // Accept a positive USD amount with up to two decimal places.

  if (
    typeof amount !== "string" ||
    !/^\d{1,8}(\.\d{1,2})?$/.test(amount) ||
    Number(amount) <= 0
  ) {
    return res.status(400).json({
      message: "Enter a positive offer with up to two decimal places.",
    });
  }

  const sql = `

    INSERT INTO offers (product_id, buyer_id, amount, status)

    SELECT p.id, ?, ?, 'pending'

    FROM products p

    WHERE p.id = ?

      AND p.seller_id <> ?

      AND p.status = 'available'

      AND p.is_negotiable = 1

      AND NOT EXISTS (

        SELECT 1

        FROM offers o

        WHERE o.product_id = p.id

          AND o.buyer_id = ?

          AND o.status = 'pending'

      )

  `;

  db.query(
    sql,

    [buyerId, amount, productId, buyerId, buyerId],

    (err, result) => {
      if (err) {
        console.error("Create offer error:", err);

        return res.status(500).json({
          message: "Could not save your offer. Please try again.",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(409).json({
          message:
            "Offer unavailable. Check that the listing is still available, " +
            "belongs to another seller, and you have no pending offer on it.",
        });
      }

      return res.status(201).json({
        id: result.insertId,

        status: "pending",

        message: "Offer sent. Waiting for the seller response.",
      });
    },
  );
};

export const list = (req, res) => {
  const { view } = req.params;

  if (view !== "received" && view !== "sent") {
    return res.status(404).json({ message: "Unknown offer page." });
  }

  const ownerColumn = view === "received" ? "p.seller_id" : "o.buyer_id";

  const sql = `

    SELECT

      o.id,

      o.amount,

      o.status,

      p.id AS product_id,

      p.title AS product_title,

      p.price AS asking_price,

      p.status AS product_status,

      buyer.full_name AS buyer_name,

      seller.full_name AS seller_name

    FROM offers o

    JOIN products p ON p.id = o.product_id

    JOIN users buyer ON buyer.id = o.buyer_id

    JOIN users seller ON seller.id = p.seller_id

    WHERE ${ownerColumn} = ?

    ORDER BY o.id DESC

  `;

  res.set("Cache-Control", "private, no-store");

  db.query(sql, [req.session.userId], (err, offers) => {
    if (err) {
      console.error("Load offers error:", err);

      return res.status(500).json({ message: "Could not load offers." });
    }

    return res.json(offers);
  });
};

export const decide = async (req, res) => {
  const offerId = Number(req.params.id);

  const decision = req.body?.decision;

  if (!Number.isSafeInteger(offerId) || offerId <= 0) {
    return res.status(400).json({ message: "Invalid offer ID." });
  }

  if (decision !== "accepted" && decision !== "rejected") {
    return res.status(400).json({ message: "Choose Accept or Reject." });
  }

  const connection = connectDB().promise();

  try {
    await connection.beginTransaction(); // Lock this seller's product before deciding any offer on it.

    const [products] = await connection.execute(
      `SELECT id, status

       FROM products

       WHERE seller_id = ?

         AND id = (SELECT product_id FROM offers WHERE id = ?)

       FOR UPDATE`,

      [req.session.userId, offerId],
    );

    if (products.length === 0) {
      await connection.rollback();

      return res

        .status(404)

        .json({ message: "Offer not found for this seller." });
    }

    const product = products[0];

    if (decision === "accepted" && product.status !== "available") {
      await connection.rollback();

      return res

        .status(409)

        .json({ message: "This product is no longer available." });
    }

    const [update] = await connection.execute(
      `UPDATE offers

       SET status = ?

       WHERE id = ? AND product_id = ? AND status = 'pending'`,

      [decision, offerId, product.id],
    );

    if (update.affectedRows === 0) {
      await connection.rollback();

      return res

        .status(409)

        .json({ message: "This offer is no longer pending." });
    }

    await connection.commit();

    return res.json({ status: decision });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      console.error("Offer rollback error:", rollbackErr);
    }

    console.error("Offer decision error:", err);

    return res.status(500).json({
      message: "Could not update the offer. Refresh to check its status.",
    });
  } finally {
    await connection.end();
  }
};
