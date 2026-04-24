const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  itemName: String,
  price: Number,
  department: String,
  barcode: String,
  tags: [String],
  notes: String,
  quantity: Number,
  lowStock: Number,
});

module.exports = mongoose.model("Product", productSchema);
``