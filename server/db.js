import mysql from "mysql2";
function connectDB() {
  const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "hsen2468",
    database: "web_prog_project",
  });

  db.connect((err) => {
    if (err) {
      console.log("Database connection failed:", err.message);
    } else {
      console.log("Connected to MySQL successfully!");
    }
  });

  return db;
}

export default connectDB;
