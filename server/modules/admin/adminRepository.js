import { db } from "../../config/db.js";

const queries = {
  users: `
    SELECT id, full_name, email, role
    FROM users
    ORDER BY id DESC
  `,

  listings: `
    SELECT p.id, p.title, u.full_name AS seller,
           c.name AS category, p.price, p.status
    FROM products p
    JOIN users u ON u.id = p.seller_id
    JOIN categories c ON c.id = p.category_id
    WHERE p.deleted_at IS NULL
    ORDER BY p.id DESC
  `,

  offers: `
    SELECT o.id, p.title AS product, buyer.full_name AS buyer,
           seller.full_name AS seller, o.amount, o.status
    FROM offers o
    JOIN products p ON p.id = o.product_id
    JOIN users buyer ON buyer.id = o.buyer_id
    JOIN users seller ON seller.id = p.seller_id
    ORDER BY o.id DESC
  `,

  orders: `
    SELECT o.id, p.title AS product, buyer.full_name AS buyer,
           seller.full_name AS seller, o.final_price, o.status,
           o.buyer_phone, o.buyer_email
    FROM orders o
    JOIN products p ON p.id = o.product_id
    JOIN users buyer ON buyer.id = o.buyer_id
    JOIN users seller ON seller.id = o.seller_id
    ORDER BY o.id DESC
  `,

  reviews: `
    SELECT r.id, u.full_name AS author, r.rating, r.comment
    FROM marketplace_reviews r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.id DESC
  `,
};

export async function getAdminRecords(section) {
  if (!Object.hasOwn(queries, section)) {
    return null;
  }

  const [rows] = await db.promise().query(queries[section]);
  return rows;
}

export async function removeListing(id) {
  const [result] = await db.promise().execute(
    `UPDATE products
     SET deleted_at = CURRENT_TIMESTAMP
     WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );

  return result.affectedRows > 0;
}
