import express from "express";
import connectDB from "./db.js";
import bcrypt from "bcryptjs";
import session from "express-session";
//for the photo insertion
import multer from "multer";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = 3001;

const db = connectDB();

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

const uploadsFolder = fileURLToPath(new URL("./uploads/", import.meta.url));

// Create the folder if it doesn't exist
fs.mkdirSync(uploadsFolder, { recursive: true });

// Allow React to access the uploaded images
app.use("/uploads", express.static(uploadsFolder));

// Image types we'll accept
const imageTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: uploadsFolder,

  filename: (req, file, cb) => {
    const extension = imageTypes[file.mimetype];
    cb(null, randomUUID() + extension);
  },
});

const upload = multer({
  storage: storage,

  limits: {
    files: 4,
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (imageTypes[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WebP images are allowed"));
    }
  },
});

// Delete uploaded files if saving the product fails
function deleteUploadedFiles(files) {
  for (const file of files || []) {
    fs.unlink(file.path, () => {});
  }
}

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "You must log in to sell a product",
    });
  }

  next();
}

app.post("/api/signup", async (req, res) => {
  const { full_name, email, password } = req.body;

  // 1. Check required fields
  if (!full_name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  if (
    typeof full_name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  const name = full_name.trim();
  const userEmail = email.trim().toLowerCase();

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    //REVIEW
    return res.status(400).json({
      message: "Please enter valid account information",
    });
  }

  if (password.length < 8) {
    //add more constraints
    return res.status(400).json({
      message: "Password must be at least 8 characters",
    });
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Insert user into MySQL
  const sql = `
        INSERT INTO users (full_name, email, password_hash)
        VALUES (?, ?, ?)
    `;

  db.query(sql, [name, userEmail, hashedPassword], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          message: "Email already registered",
        });
      }

      console.log(err);

      return res.status(500).json({
        message: "Database error",
      });
    }
    return res.status(201).json({
      message: "Account created successfully!",
    });
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email.trim().toLowerCase()], async (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    // 1. Check if user exists
    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = results[0];

    // 2. Check password
    let validPassword;

    try {
      validPassword = await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      return res.status(500).json({
        message: "Login error",
      });
    }

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 4. Create the login session
    req.session.regenerate((sessionErr) => {
      if (sessionErr) {
        return res.status(500).json({
          message: "Session error",
        });
      }

      req.session.userId = user.id;

      req.session.save((saveErr) => {
        if (saveErr) {
          return res.status(500).json({
            message: "Session error",
          });
        }

        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
          },
        });
      });
    });
  });
});

//We also need a way for React to check whether someone is already logged in.
app.get("/api/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "Not logged in",
    });
  }

  const sql = `
        SELECT id, full_name, email, role
        FROM users
        WHERE id = ?
    `;

  db.query(sql, [req.session.userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error",
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    res.json(results[0]);
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        message: "Logout failed",
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      message: "Logged out successfully",
    });
  });
});

app.get("/api/products", (req, res) => {
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
});

app.get("/api/me/products", requireLogin, (req, res) => {
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
});

app.patch("/api/products/:id/sold", requireLogin, (req, res) => {
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
});

app.get("/api/categories", (req, res) => {
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
});

app.get("/api/products/:id", (req, res) => {
  const productId = Number(req.params.id);

  // Check that the ID is valid
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  }

  // Get product information
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
    }

    // Product doesn't exist
    if (results.length === 0) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const product = results[0];

    // Get all images belonging to this product
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
      }

      // Return product and its images
      res.set("Cache-Control", "private, no-store");
      res.json({
        ...product,
        viewerLoggedIn: Boolean(req.session.userId),
        viewerIsSeller: req.session.userId === product.seller_id,
        images: images.map((image) => image.image_url),
      });
    });
  });
});

app.post("/api/products/:id/offers", requireLogin, (req, res) => {
  const productId = Number(req.params.id);
  const buyerId = req.session.userId;
  const amount = req.body?.amount;

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product ID." });
  }

  // Accept a positive USD amount with up to two decimal places.
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
});

app.post(
  "/api/products",
  requireLogin,
  upload.array("images", 4),
  (req, res) => {
    const { title, description, category_id, price, condition, is_negotiable } =
      req.body;

    const files = req.files || [];
    const categoryId = Number(category_id);
    const productPrice = Number(price);

    const validConditions = ["Brand New", "Like New", "Used", "For Parts"];

    // 1. Validate product information
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
      typeof description === "string" ? description.trim() : "";

    // Require at least one image
    if (files.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one product image",
      });
    }

    // Maximum 5 MB per image
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      deleteUploadedFiles(files);

      return res.status(400).json({
        message: "Each image must be 5 MB or smaller",
      });
    }

    // 2. Insert product
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

      const productId = result.insertId;

      // 3. Prepare image records
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
      `;

      // 4. Save images in MySQL
      db.query(imageSql, imageValues, (imageErr) => {
        if (imageErr) {
          console.log("Image insert error:", imageErr);

          // Remove incomplete listing
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
        }

        // 5. Send response to React
        return res.status(201).json({
          message: "Product published successfully!",
          id: productId,
        });
      });
    });
  },
);

app.get("/api/reviews", (req, res) => {
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
});

app.post("/api/reviews", requireLogin, (req, res) => {
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
});

app.get("/api/me/offers/:view", requireLogin, (req, res) => {
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
});

app.patch("/api/offers/:id/decision", requireLogin, async (req, res) => {
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
    await connection.beginTransaction();

    // Lock this seller's product before deciding any offer on it.
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

    if (decision === "accepted") {
      await connection.execute(
        `INSERT INTO orders
           (product_id, buyer_id, seller_id, offer_id, final_price, status)
         SELECT product_id, buyer_id, ?, id, amount, 'completed'
         FROM offers
         WHERE id = ?`,
        [req.session.userId, offerId],
      );

      await connection.execute(
        "UPDATE products SET status = 'sold' WHERE id = ?",
        [product.id],
      );

      await connection.execute(
        `UPDATE offers SET status = 'rejected'
         WHERE product_id = ? AND status = 'pending'`,
        [product.id],
      );
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
});

async function getCheckoutDetails(connection, productId, buyerId) {
  const [products] = await connection.execute(
    `SELECT p.id, p.title, p.price, p.status, p.seller_id,
            u.full_name AS seller_name
     FROM products p
     JOIN users u ON u.id = p.seller_id
     WHERE p.id = ?`,
    [productId],
  );

  const product = products[0];

  if (!product) {
    throw Object.assign(new Error("Product not found."), { status: 404 });
  }

  if (product.seller_id === buyerId) {
    throw Object.assign(new Error("You own this listing."), { status: 403 });
  }

  if (product.status !== "available") {
    throw Object.assign(new Error("This product is no longer available."), {
      status: 409,
    });
  }

  const [offers] = await connection.execute(
    `SELECT id, amount
     FROM offers
     WHERE product_id = ? AND buyer_id = ? AND status = 'accepted'
     ORDER BY id DESC
     LIMIT 1`,
    [productId, buyerId],
  );

  const acceptedOffer = offers[0];

  return {
    id: product.id,
    title: product.title,
    seller_id: product.seller_id,
    seller_name: product.seller_name,
    final_price: acceptedOffer ? acceptedOffer.amount : product.price,
    offer_id: acceptedOffer ? acceptedOffer.id : null,
  };
}

app.get("/api/checkout/:productId", requireLogin, async (req, res) => {
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
});

app.post("/api/checkout/:productId", requireLogin, async (req, res) => {
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
    await connection.beginTransaction();

    // Serialize purchases and offer decisions for this product.
    await connection.execute(
      "SELECT id FROM products WHERE id = ? FOR UPDATE",
      [productId],
    );

    // A retry after a successful purchase returns the existing order.
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

    const details = await getCheckoutDetails(connection, productId, buyerId);

    // Ask the buyer to review checkout again if the price changed.
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
    );

    // Close competing offers while preserving the selected accepted offer.
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
});

app.get("/api/me/orders/:view", requireLogin, (req, res) => {
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
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: "Upload failed. Maximum 4 images, 20 MB total.",
    });
  }

  if (err.message === "Only JPG, PNG and WebP images are allowed") {
    return res.status(400).json({
      message: err.message,
    });
  }

  next(err);
});

app.get("/api/test-db", (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Running on port : ${PORT}`);
});
