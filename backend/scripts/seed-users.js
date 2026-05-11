/**
 * Seed script: creates default users for all roles.
 *
 * Run: node scripts/seed-users.js
 *
 * Skips any user whose email already exists in the database.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/exam-duty";
const SALT_ROUNDS = 10;

const seedUsers = [
  {
    name: "Admin",
    email: "admin@examduty.com",
    password: "Admin123",
    role: "cs",
    department: "Administration",
    designation: "System Administrator",
  },
  {
    name: "Deputy Admin",
    email: "dcs@examduty.com",
    password: "Dcs12345",
    role: "dcs",
    department: "Administration",
    designation: "Deputy Controller",
  },
  {
    name: "Resource Scheduler",
    email: "rs@examduty.com",
    password: "Rs123456",
    role: "rs",
    department: "Examination Cell",
    designation: "Resource Coordinator",
  },
  {
    name: "Invigilator One",
    email: "invigilator@examduty.com",
    password: "Invig123",
    role: "invigilator",
    department: "Computer Science",
    designation: "Assistant Professor",
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");

  let created = 0;
  let skipped = 0;

  for (const user of seedUsers) {
    const exists = await usersCollection.findOne({ email: user.email });
    if (exists) {
      console.log(`SKIP: ${user.email} (already exists)`);
      skipped++;
      continue;
    }

    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

    await usersCollection.insertOne({
      name: user.name,
      email: user.email,
      password: hashedPassword,
      phone: null,
      role: user.role,
      department: user.department,
      designation: user.designation,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`CREATED: ${user.email} (${user.role})`);
    created++;
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
