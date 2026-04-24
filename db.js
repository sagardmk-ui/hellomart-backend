const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./inventory.db", (err) => {
  if (err) {
    console.error("Database error", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

db.serialize(() => {

db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemName TEXT,
    price TEXT,
    department TEXT,
    barcode TEXT,
    tags TEXT,
    notes TEXT,
    quantity INTEGER DEFAULT 0,
    lowStock INTEGER DEFAULT 5
  )
`);


  db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    )
  `);
});

module.exports = db;
``