const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./mongo");
const User = require("./models/User");
const Product = require("./models/Product");
const Department = require("./models/Department");

const app = express();
const PORT = process.env.PORT || 4000;

console.log("🚀 SERVER.JS IS RUNNING");

/* ================= CONNECT DATABASE ================= */
connectDB();

/* ================= MIDDLEWARE ================= */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://hello-mart-bkrp.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json({ limit: "10mb" }));

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("HelloMart Backend is running (MongoDB)");
});

/* ================= ONE‑TIME ADMIN SETUP =================
   ⚠️ USE ONCE, THEN DELETE THIS ROUTE
*/
app.get("/setup-admin", async (req, res) => {
  try {
    await User.updateOne(
      { email: "admin@test.com" },
      { email: "admin@test.com", password: "admin123" },
      { upsert: true }
    );

    res.json({
      success: true,
      login: {
        email: "admin@test.com",
        password: "admin123",
      },
    });
  } catch (err) {
    console.error("SETUP ADMIN ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ success: false });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* ================= PRODUCTS ================= */
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json([]);
  }
});

app.post("/products", async (req, res) => {
  try {
    await Product.create(req.body);

    // auto-create department
    if (req.body.department) {
      await Department.updateOne(
        { name: req.body.department },
        { name: req.body.department },
        { upsert: true }
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    res.status(500).json({ success: false });
  }
});

app.put("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= DEPARTMENTS ================= */
app.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json([]);
  }
});

app.post("/departments", async (req, res) => {
  try {
    await Department.updateOne(
      { name: req.body.name },
      { name: req.body.name },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.put("/departments/:id", async (req, res) => {
  try {
    await Department.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.delete("/departments/:id", async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= IMPORT PRODUCTS (FIXED & SAFE) ================= */
app.post("/import", async (req, res) => {
  try {
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No items to import" });
    }

    // normalize data
    const cleanedItems = items.map(item => ({
      itemName: item.itemName || "",
      price: Number(item.price) || 0,
      department: item.department || "",
      barcode: item.barcode || "",
      tags: item.tags || [],
      notes: item.notes || "",
      quantity: Number(item.quantity) || 0,
      lowStock: Number(item.lowStock) || 0,
    }));

    await Product.insertMany(cleanedItems, { ordered: false });

    // auto-create departments
    const departments = [
      ...new Set(cleanedItems.map(i => i.department).filter(Boolean)),
    ];

    await Promise.all(
      departments.map(name =>
        Department.updateOne({ name }, { name }, { upsert: true })
      )
    );

    res.json({
      success: true,
      count: cleanedItems.length,
    });
  } catch (err) {
    console.error("IMPORT ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});