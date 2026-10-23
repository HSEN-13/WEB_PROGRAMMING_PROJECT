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
    secret: process.env.SESSION_SECRET || "local-development-secret-change-me",
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
      res.json({
        ...product,
        images: images.map((image) => image.image_url),
      });
    });
  });
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
