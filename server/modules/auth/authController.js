import { db } from "../../config/db.js";

import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { full_name, email, password } = req.body; // 1. Check required fields

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
  } // 2. Hash password

  const hashedPassword = await bcrypt.hash(password, 10); // 3. Insert user into MySQL

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
};

export const login = (req, res) => {
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
    } // 1. Check if user exists

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = results[0]; // 2. Check password

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
    } // 4. Create the login session

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
};

export const me = (req, res) => {
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
};

export const logout = (req, res) => {
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
};
