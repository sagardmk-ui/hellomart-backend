const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./mongo");
const User = require("./models/User");
const Product = require("./models/Product");
const Department = require("./models/Department");

const app = express();
const PORT = process.env.PORT || 4000;

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
  try {
    await User.updateOne(
      { email: "admin@test.com" },
      { email: "admin@test.com", password: "admin123" },
      { upsert: true }
    );

    res.json({
      success: true,
      login: { email: "admin@test.com", password: "admin123" },
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
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
``