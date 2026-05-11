/**
 * One-time migration script: converts old roles to new role system.
 *
 *   admin  → cs
 *   faculty → rs
 *
 * Run: node scripts/migrate-roles.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/exam-duty";

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");

  // admin → cs
  const adminResult = await usersCollection.updateMany(
    { role: "admin" },
    { $set: { role: "cs" } }
  );
  console.log(`admin → cs: ${adminResult.modifiedCount} users updated`);

  // faculty → rs
  const facultyResult = await usersCollection.updateMany(
    { role: "faculty" },
    { $set: { role: "rs" } }
  );
  console.log(`faculty → rs: ${facultyResult.modifiedCount} users updated`);

  // Verify no old roles remain
  const remaining = await usersCollection.countDocuments({
    role: { $in: ["admin", "faculty"] },
  });

  if (remaining === 0) {
    console.log("Migration complete — no old roles remain.");
  } else {
    console.error(`WARNING: ${remaining} users still have old roles!`);
  }

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
