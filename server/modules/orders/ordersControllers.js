import connectDB, { db } from "../../config/db.js";

import { getCheckoutDetails } from "./ordersServices.js";

export const checkout = async (req, res) => {
  const productId = Number(req.params.productId);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product ID." });
  }

  res.set("Cache-Control", "private, no-store");

  try {
    const details = await getCheckoutDetails(
      db.promise(),

      productId,

      req.session.userId,
    );

    return res.json(details);
  } catch (err) {
    console.error("Checkout details error:", err);

    return res.status(err.status || 500).json({
      message: err.status ? err.message : "Could not load checkout.",
    });
  }
};

export const buy = async (req, res) => {
  const productId = Number(req.params.productId);

  const buyerId = req.session.userId;

  const { phone, email = "", expected_price } = req.body || {};

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product ID." });
  }

  const phoneText = typeof phone === "string" ? phone.trim() : "";

  const emailText = typeof email === "string" ? email.trim() : null;

  const phoneDigits = phoneText.replace(/\D/g, "");

  if (
    phoneText.length > 30 ||
    !/^\+?[0-9 ()-]+$/.test(phoneText) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    return res.status(400).json({
      message:
        "Enter a phone number with 7–15 digits, including the country code.",
    });
  }

  if (
    emailText === null ||
    emailText.length > 254 ||
    (emailText !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailText))
  ) {
    return res.status(400).json({
      message: "Enter a valid email or leave it empty.",
    });
  }

  const connection = connectDB().promise();

  try {
    await connection.beginTransaction(); // Serialize purchases and offer decisions for this product.

    await connection.execute(
      "SELECT id FROM products WHERE id = ? FOR UPDATE",

      [productId],
    ); // A retry after a successful purchase returns the existing order.

    const [existingOrders] = await connection.execute(
      `SELECT id FROM orders

       WHERE product_id = ? AND buyer_id = ?

         AND status IN ('pending', 'completed')

       ORDER BY id DESC

       LIMIT 1`,

      [productId, buyerId],
    );

    if (existingOrders.length > 0) {
      await connection.commit();

      return res.json({ id: existingOrders[0].id });
    }

    const details = await getCheckoutDetails(connection, productId, buyerId); // Ask the buyer to review checkout again if the price changed.

    if (
      typeof expected_price !== "string" ||
      Number(expected_price) !== Number(details.final_price)
    ) {
      throw Object.assign(
        new Error("The price changed. Refresh checkout before buying."),

        { status: 409 },
      );
    }

    const [order] = await connection.execute(
      `INSERT INTO orders

         (product_id, buyer_id, seller_id, offer_id, final_price,

          status, buyer_phone, buyer_email)

       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,

      [
        productId,

        buyerId,

        details.seller_id,

        details.offer_id,

        details.final_price,

        phoneText,

        emailText || null,
      ],
    );

    await connection.execute(
      "UPDATE products SET status = 'reserved' WHERE id = ?",

      [productId],
    ); // Close competing offers while preserving the selected accepted offer.

    await connection.execute(
      `UPDATE offers

       SET status = 'rejected'

       WHERE product_id = ?

         AND status IN ('pending', 'accepted')

         AND (? IS NULL OR id <> ?)`,

      [productId, details.offer_id, details.offer_id],
    );

    await connection.commit();

    return res.status(201).json({ id: order.insertId });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      console.error("Checkout rollback error:", rollbackErr);
    }

    console.error("Checkout error:", err);

    return res.status(err.status || 500).json({
      message: err.status
        ? err.message
        : "Could not confirm the purchase. Check My Purchases before retrying.",
    });
  } finally {
    await connection.end().catch((err) => {
      console.error("Close checkout connection error:", err);
    });
  }
};

export const list = (req, res) => {
  const { view } = req.params;

  if (view !== "purchases" && view !== "sales") {
    return res.status(404).json({ message: "Unknown order page." });
  }

  const ownerColumn = view === "sales" ? "o.seller_id" : "o.buyer_id";

  const sql = `

    SELECT

      o.id,

      o.product_id,

      o.final_price,

      o.status,

      o.buyer_phone,

      o.buyer_email,

      p.title AS product_title,

      buyer.full_name AS buyer_name,

      seller.full_name AS seller_name

    FROM orders o

    JOIN products p ON p.id = o.product_id

    JOIN users buyer ON buyer.id = o.buyer_id

    JOIN users seller ON seller.id = o.seller_id

    WHERE ${ownerColumn} = ?

    ORDER BY o.id DESC

  `;

  res.set("Cache-Control", "private, no-store");

  db.query(sql, [req.session.userId], (err, orders) => {
    if (err) {
      console.error("Load orders error:", err);

      return res.status(500).json({ message: "Could not load orders." });
    }

    return res.json(orders);
  });
};

export const changeStatus = async (req, res) => {
  const orderId = Number(req.params.id);

  const userId = req.session.userId;

  const nextStatus = req.body?.status;

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({ message: "Invalid order ID." });
  }

  if (!["completed", "cancelled"].includes(nextStatus)) {
    return res.status(400).json({ message: "Invalid order status." });
  }

  const connection = connectDB().promise();

  try {
    await connection.beginTransaction(); // Use the same product-first lock order as checkout.

    const [products] = await connection.execute(
      `SELECT id, status FROM products

       WHERE id = (

         SELECT product_id FROM orders

         WHERE id = ? AND (buyer_id = ? OR seller_id = ?)

       )

       FOR UPDATE`,

      [orderId, userId, userId],
    );

    if (products.length === 0) {
      await connection.rollback();

      return res.status(404).json({ message: "Order not found." });
    }

    const [orders] = await connection.execute(
      `SELECT id, buyer_id, seller_id, offer_id, status

       FROM orders WHERE id = ? FOR UPDATE`,

      [orderId],
    );

    const order = orders[0];

    if (nextStatus === "completed" && order.seller_id !== userId) {
      await connection.rollback();

      return res.status(403).json({
        message: "Only the seller can confirm pickup and payment.",
      });
    } // Repeated clicks or retries return the saved result.

    if (order.status === nextStatus) {
      await connection.commit();

      return res.json({ status: nextStatus });
    }

    if (order.status !== "pending" || products[0].status !== "reserved") {
      await connection.rollback();

      return res.status(409).json({
        message: "This order can no longer be changed. Refresh the page.",
      });
    }

    await connection.execute("UPDATE orders SET status = ? WHERE id = ?", [
      nextStatus,

      orderId,
    ]);

    const productStatus = nextStatus === "completed" ? "sold" : "available";

    await connection.execute("UPDATE products SET status = ? WHERE id = ?", [
      productStatus,

      products[0].id,
    ]);

    if (nextStatus === "cancelled" && order.offer_id !== null) {
      const offerStatus = order.buyer_id === userId ? "withdrawn" : "rejected";

      await connection.execute(
        "UPDATE offers SET status = ? WHERE id = ? AND status = 'accepted'",

        [offerStatus, order.offer_id],
      );
    }

    await connection.commit();

    return res.json({ status: nextStatus });
  } catch (err) {
    try {
      await connection.rollback();
    } catch (rollbackErr) {
      console.error("Order rollback error:", rollbackErr);
    }

    console.error("Update order error:", err);

    return res.status(500).json({
      message: "Could not update the order. Refresh to check its status.",
    });
  } finally {
    await connection.end().catch((err) => {
      console.error("Close order connection error:", err);
    });
  }
};
