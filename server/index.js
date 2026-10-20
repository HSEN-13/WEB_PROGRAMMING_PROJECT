import express from "express";
import connectDB from "./db.js";
import bcrypt from "bcryptjs";
import session from "express-session";

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

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the server!" });
});

const products = [
  {
    id: 1,
    title: "NVIDIA RTX 3070 Ti Founders Edition",
    price: 380,
    condition: "Used",
    category: "GPU",
  },
  {
    id: 2,
    title: "Corsair Vengeance 32GB DDR5 6000MHz",
    price: 120,
    condition: "Like New",
    category: "RAM",
  },
  {
    id: 3,
    title: "AMD Ryzen 5 7600X Processor",
    price: 190,
    condition: "Brand New",
    category: "CPU",
  },
  {
    id: 4,
    title: "Samsung 980 PRO 2TB NVMe SSD",
    price: 130,
    condition: "Like New",
    category: "SSD",
  },
];

app.get("/api/products", (req, res) => {
  res.json(products);
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
