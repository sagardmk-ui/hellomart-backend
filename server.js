
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

/* ===== MIDDLEWARE ===== */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://hellomart.vercel.app"
    ],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ===== HEALTH CHECK ===== */
app.get("/", (req, res) => {
  res.send("HelloMart Backend is running");
});

/* ===== PRODUCTS ===== */
app.get("/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json([]);
    }
    res.json(rows || []);
  });
});

app.post("/products", (req, res) => {
  const {
    itemName,
    price,
    department,
    barcode,
    tags,
    notes,
    quantity = 0,
    lowStock = 5
  } = req.body;

  db.run(
    `INSERT INTO products
     (itemName, price, department, barcode, tags, notes, quantity, lowStock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      itemName,
      price,
      department,
      barcode,
      JSON.stringify(tags || []),
      notes,
      quantity,
      lowStock
    ],
    (err) => {
      if (err) {
        console.error("INSERT ERROR:", err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true });
    }
  );
});

app.put("/products/:id", (req, res) => {
  const {
    itemName,
    price,
    department,
    barcode,
    tags,
    notes,
    quantity,
    lowStock
  } = req.body;

  db.run(
    `UPDATE products
     SET itemName=?, price=?, department=?, barcode=?, tags=?, notes=?, quantity=?, lowStock=?
     WHERE id=?`,
    [
      itemName,
      price,
      department,
      barcode,
      JSON.stringify(tags || []),
      notes,
      quantity,
      lowStock,
      req.params.id
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true });
    }
  );
});

/* ===== DEPARTMENTS ===== */
app.get("/departments", (req, res) => {
  db.all("SELECT * FROM departments", [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.json([]);
    }
    res.json(rows);
  });
});

app.post("/departments", (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ success: false });
  }

  db.run(
    "INSERT OR IGNORE INTO departments (name) VALUES (?)",
    [req.body.name],
    () => res.json({ success: true })
  );
});

app.put("/departments/:id", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false });

  db.run(
    "UPDATE departments SET name = ? WHERE id = ?",
    [name, req.params.id],
    () => res.json({ success: true })
  );
});

app.delete("/departments/:id", (req, res) => {
  db.run(
    "DELETE FROM departments WHERE id = ?",
    [req.params.id],
    () => res.json({ success: true })
  );
});

/* ===== START SERVER ===== */
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});