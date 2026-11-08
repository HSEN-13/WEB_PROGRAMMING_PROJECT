import { db } from "../../config/db.js";

import { deleteUploadedFiles } from "./products.upload.js";

export const list = (req, res) => {
  const sql = `

    SELECT

      p.id,

      p.title,

      p.description,

      p.price,

      p.\`condition\`,

      p.is_negotiable,

      p.created_at,

      c.name AS category,

      c.slug AS category_slug,

      u.full_name AS seller_name,

      (

        SELECT pi.image_url

        FROM product_images pi

        WHERE pi.product_id = p.id

        ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC

        LIMIT 1

      ) AS image_url

    FROM products p

    JOIN categories c ON p.category_id = c.id

    JOIN users u ON p.seller_id = u.id

    WHERE p.status = 'available'

    ORDER BY p.created_at DESC, p.id DESC

  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.log("Products error:", err);

      return res.status(500).json({
        message: "Could not load products",
      });
    }

    return res.json(results);
  });
};

export const mine = (req, res) => {
  const sql = `

    SELECT

      p.id,

      p.title,

      p.price,

      p.status,

      (

        SELECT pi.image_url

        FROM product_images pi

        WHERE pi.product_id = p.id

        ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC

        LIMIT 1

      ) AS image_url

    FROM products p

    WHERE p.seller_id = ?

    ORDER BY p.created_at DESC, p.id DESC

  `;

  db.query(sql, [req.session.userId], (err, products) => {
    if (err) {
      console.error("My Listings error:", err);

      return res.status(500).json({
        message: "Could not load your listings.",
      });
    }

    return res.json(products);
  });
};

export const markSold = (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product ID." });
  }

  const sql = `

    UPDATE products

    SET status = 'sold'

    WHERE id = ?

      AND seller_id = ?

      AND status = 'available'

  `;

  db.query(sql, [productId, req.session.userId], (err, result) => {
    if (err) {
      console.error("Mark as sold error:", err);

      return res.status(500).json({
        message: "Could not update the listing. Please try again.",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(409).json({
        message:
          "This listing can no longer be marked as sold. Refresh My Listings.",
      });
    }

    return res.json({ id: productId, status: "sold" });
  });
};

export const categories = (req, res) => {
  const sql = "SELECT id, name, slug FROM categories ORDER BY name";

  db.query(sql, (err, results) => {
    if (err) {
      console.log("Categories error:", err);

      return res.status(500).json({
        message: "Could not load categories",
      });
    }

    return res.json(results);
  });
};

export const details = (req, res) => {
  const productId = Number(req.params.id); // Check that the ID is valid

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  } // Get product information

  const sql = `

    SELECT

      p.id,

      p.seller_id,

      p.title,

      p.description,

      p.price,

      p.\`condition\`,

      p.is_negotiable,

      p.status,

      p.created_at,

      c.name AS category,

      u.full_name AS seller_name

    FROM products p

    JOIN categories c ON p.category_id = c.id

    JOIN users u ON p.seller_id = u.id

    WHERE p.id = ?

  `;

  db.query(sql, [productId], (err, results) => {
    if (err) {
      console.log("Product error:", err);

      return res.status(500).json({
        message: "Database error",
      });
    } // Product doesn't exist

    if (results.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const product = results[0]; // Get all images belonging to this product

    const imagesSql = `

      SELECT image_url

      FROM product_images

      WHERE product_id = ?

      ORDER BY is_primary DESC, sort_order ASC, id ASC

    `;

    db.query(imagesSql, [productId], (imageErr, images) => {
      if (imageErr) {
        console.log("Images error:", imageErr);

        return res.status(500).json({
          message: "Could not load product images",
        });
      } // Return product and its images

      res.set("Cache-Control", "private, no-store");

      res.json({
        ...product,

        viewerLoggedIn: Boolean(req.session.userId),

        viewerIsSeller: req.session.userId === product.seller_id,

        images: images.map((image) => image.image_url),
      });
    });
  });
};

export const create = (req, res) => {
  const { title, description, category_id, price, condition, is_negotiable } =
    req.body;

  const files = req.files || [];

  const categoryId = Number(category_id);

  const productPrice = Number(price);

  const validConditions = ["Brand New", "Like New", "Used", "For Parts"]; // 1. Validate product information

  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 150 ||
    !Number.isInteger(categoryId) ||
    categoryId <= 0 ||
    price === undefined ||
    !Number.isFinite(productPrice) ||
    productPrice <= 0 ||
    productPrice > 99999999.99 ||
    !validConditions.includes(condition) ||
    !["true", "false"].includes(is_negotiable)
  ) {
    deleteUploadedFiles(files);

    return res.status(400).json({
      message: "Please enter valid product information",
    });
  }

  const productDescription =
    typeof description === "string" ? description.trim() : ""; // Require at least one image

  if (files.length === 0) {
    return res.status(400).json({
      message: "Please upload at least one product image",
    });
  } // Maximum 5 MB per image

  if (files.some((file) => file.size > 5 * 1024 * 1024)) {
    deleteUploadedFiles(files);

    return res.status(400).json({
      message: "Each image must be 5 MB or smaller",
    });
  } // 2. Insert product

  const sql = `

      INSERT INTO products

      (

        seller_id,

        category_id,

        title,

        description,

        price,

        \`condition\`,

        is_negotiable

      )

      VALUES (?, ?, ?, ?, ?, ?, ?)

    `;

  const values = [
    req.session.userId,

    categoryId,

    title.trim(),

    productDescription,

    productPrice,

    condition,

    is_negotiable === "true" ? 1 : 0,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.log("Product insert error:", err);

      deleteUploadedFiles(files);

      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          message: "Invalid category or user",
        });
      }

      return res.status(500).json({
        message: "Could not create product",
      });
    }

    const productId = result.insertId; // 3. Prepare image records

    const placeholders = files.map(() => "(?, ?, ?, ?)").join(", ");

    const imageValues = files.flatMap((file, index) => [
      productId,

      "/uploads/" + file.filename,

      index === 0 ? 1 : 0,

      index,
    ]);

    const imageSql = `

        INSERT INTO product_images

        (product_id, image_url, is_primary, sort_order)

        VALUES ${placeholders}

      `; // 4. Save images in MySQL

    db.query(imageSql, imageValues, (imageErr) => {
      if (imageErr) {
        console.log("Image insert error:", imageErr); // Remove incomplete listing

        db.query(
          "DELETE FROM products WHERE id = ?",

          [productId],

          (deleteErr) => {
            if (deleteErr) {
              console.log("Cleanup error:", deleteErr);
            }

            deleteUploadedFiles(files);

            return res.status(500).json({
              message: "Could not save product images",
            });
          },
        );

        return;
      } // 5. Send response to React

      return res.status(201).json({
        message: "Product published successfully!",

        id: productId,
      });
    });
  });
};
