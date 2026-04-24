const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./mongo");
const User = require("./models/User");
const Product = require("./models/Product");
const Department = require("./models/Department");

const app = express();
const PORT = process.env.PORT || 4000;

console.log("🚨 THIS SERVER.JS IS RUNNING 🚨");

/* ===== CONNECT DATABASE ===== */
connectDB();

/* ===== MIDDLEWARE ===== */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://hello-mart-bkrp.vercel.app",
    ],
  })
);
app.use(express.json());

/* ===== HEALTH CHECK ===== */
app.get("/", (req, res) => {
  res.send("HelloMart Backend is running (MongoDB)");
});

/* ===== ONE-TIME ADMIN SETUP ===== */

app.get("/setup-admin", async (req, res) => {
  await User.updateOne(
    { email: "admin@test.com" },
    { email: "admin@test.com", password: "admin123" },
    { upsert: true }
  );

  res.json({
    success: true,
    login: { email: "admin@test.com", password: "admin123" },
  });
});


/* ===== LOGIN ===== */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });
  if (!user) {
    return res.status(401).json({ success: false });
  }

  res.json({ success: true });
});

/* ===== PRODUCTS ===== */
app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post("/products", async (req, res) => {
  await Product.create(req.body);
  res.json({ success: true });
});

app.put("/products/:id", async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
});

/* ===== DEPARTMENTS ===== */
app.get("/departments", async (req, res) => {
  const departments = await Department.find();
  res.json(departments);
});

app.post("/departments", async (req, res) => {
  await Department.updateOne(
    { name: req.body.name },
    { name: req.body.name },
    { upsert: true }
  );
  res.json({ success: true });
});

app.put("/departments/:id", async (req, res) => {
  await Department.findByIdAndUpdate(req.params.id, req.body);
  res.json({ success: true });
});

app.delete("/departments/:id", async (req, res) => {
  await Department.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

/* ===== START SERVER ===== */
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

/* ===== IMPORT PRODUCTS ===== */
app.post("/import", async (req, res) => {
  try {
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "No items to import" });
    }

    await Product.insertMany(items);

    // auto-create departments from imported products
    const departments = [...new Set(items.map(i => i.department).filter(Boolean))];
    await Promise.all(
      departments.map(name =>
        Department.updateOne({ name }, { name }, { upsert: true })
      )
    );

    res.json({ success: true, count: items.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});