const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://hello-mart-bkrp.vercel.app"
    ],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("HelloMart Backend is running");
});

/* ================= ONE-TIME ADMIN SETUP =================
   ⚠️ Call this ONCE after deployment
   URL:
   https://your-backend-url/setup-admin
*/
app.get("/setup-admin", (req, res) => {
  try {
    db.prepare(
      "INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)"
    ).run("admin@test.com", "admin123");

    res.json({
      success: true,
      login: {
        email: "admin@test.com",
        password: "admin123"
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ================= LOGIN ================= */
app.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db
      .prepare("SELECT * FROM users WHERE email = ? AND password = ?")
      .get(email, password);

    if (!user) {
      return res.status(401).json({ success: false });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ================= PRODUCTS ================= */

app.get("/products", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM products").all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});



app.post("/products", (req, res) => {
  try {
    const {
      itemName, price, department, barcode, tags, notes,
      quantity = 0, lowStock = 5
    } = req.body;

    db.prepare(`
      INSERT INTO products
      (itemName, price, department, barcode, tags, notes, quantity, lowStock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      itemName,
      price,
      department,
      barcode,
      JSON.stringify(tags || []),
      notes,
      quantity,
      lowStock
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
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
    `
    UPDATE products
    SET itemName=?, price=?, department=?, barcode=?,
        tags=?, notes=?, quantity=?, lowStock=?
    WHERE id=?
    `,
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

/* ================= DEPARTMENTS ================= */
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

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
