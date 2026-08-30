/**
 * Backfill: re-derive `roles` from `designation` for users whose stored roles
 * disagree with the designation rule.
 *
 * Accounts seeded before the designation → roles rule existed kept whatever
 * roles they were created with. The most visible symptom is that no account is
 * multi-role, so the /select-role flow has nothing to exercise — an Assistant
 * Professor should hold ["rs", "invigilator"] but may hold only one of them.
 *
 * Only designations that FIX a role set are touched (HOD/Dean, Professor,
 * Associate Professor, Assistant Professor). "Other" and any unrecognised
 * designation are left alone on purpose: for those the role is a deliberate
 * choice by whoever created the account, and this script has no basis to
 * overrule it. That is what keeps a hand-made "System Administrator" CS
 * account safe.
 *
 * Run:
 *   node scripts/backfill-roles-from-designation.js           # dry run
 *   node scripts/backfill-roles-from-designation.js --apply   # write
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const User = require("../modules/auth/auth.model");
const {
  resolveRolesFromDesignation,
} = require("../shared/utils/roleResolver");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/exam-duty";
const APPLY = process.argv.includes("--apply");

const sameSet = (a = [], b = []) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected. Mode: ${APPLY ? "APPLY" : "dry run"}\n`);

  // isActive:{$ne:false} rather than the default filter, so soft-deleted users
  // are surfaced too — they can be restored later and would carry stale roles.
  const users = await User.find({}).select("name email designation roles").lean();

  const changes = [];
  const skipped = [];

  for (const user of users) {
    const fixed = resolveRolesFromDesignation(user.designation);
    if (!fixed) {
      skipped.push(`${user.email} — designation "${user.designation || "(none)"}" does not fix a role set`);
      continue;
    }
    if (sameSet(fixed, user.roles)) continue;
    changes.push({ user, from: user.roles || [], to: fixed });
  }

  if (skipped.length) {
    console.log("Left alone (designation does not determine roles):");
    for (const s of skipped) console.log(`  · ${s}`);
    console.log();
  }

  if (!changes.length) {
    console.log("No users need a roles update.");
    await mongoose.disconnect();
    return;
  }

  console.log(`${changes.length} user(s) to update:`);
  for (const c of changes) {
    console.log(
      `  · ${c.user.email.padEnd(32)} ${c.user.designation}\n` +
        `      [${c.from.join(", ")}] -> [${c.to.join(", ")}]`,
    );
  }

  if (!APPLY) {
    console.log("\nDry run — nothing written. Re-run with --apply to commit.");
    await mongoose.disconnect();
    return;
  }

  for (const c of changes) {
    await User.updateOne({ _id: c.user._id }, { $set: { roles: c.to } });
  }
  console.log(`\nUpdated ${changes.length} user(s).`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
