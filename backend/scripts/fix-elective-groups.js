// For every semester, ensure a "Professional Electives" and "Open Electives"
// ElectiveGroup exists, and attach any ungrouped elective course of the
// matching type to that group. Idempotent.

require("dotenv").config();
const mongoose = require("mongoose");

const Department = require("../modules/department/department.model");
const Semester = require("../modules/department/semester.model");
const Course = require("../modules/department/course.model");
const ElectiveGroup = require("../modules/department/electiveGroup.model");

const GROUP_NAME = {
  professional: "Professional Electives",
  open: "Open Electives",
};

const ensureGroup = async (semesterId, type) => {
  const name = GROUP_NAME[type];
  let group = await ElectiveGroup.findOne({ semester: semesterId, name });
  if (!group) {
    group = await ElectiveGroup.create({ name, type, semester: semesterId });
    return { group, created: true };
  }
  return { group, created: false };
};

const main = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const departments = await Department.find({});
  let groupsCreated = 0;
  let coursesAttached = 0;

  for (const dept of departments) {
    const semesters = await Semester.find({ department: dept._id }).sort({ name: 1 });
    for (const sem of semesters) {
      const [profGroupRes, openGroupRes] = await Promise.all([
        ensureGroup(sem._id, "professional"),
        ensureGroup(sem._id, "open"),
      ]);
      if (profGroupRes.created) groupsCreated++;
      if (openGroupRes.created) groupsCreated++;

      const profRes = await Course.updateMany(
        { semester: sem._id, courseType: "professional_elective", electiveGroup: null },
        { $set: { electiveGroup: profGroupRes.group._id } }
      );
      const openRes = await Course.updateMany(
        { semester: sem._id, courseType: "open_elective", electiveGroup: null },
        { $set: { electiveGroup: openGroupRes.group._id } }
      );
      coursesAttached += profRes.modifiedCount + openRes.modifiedCount;

      console.log(
        `  [${dept.code} sem ${sem.name}] prof group ${profGroupRes.created ? "created" : "exists"} (attached ${profRes.modifiedCount}), open group ${openGroupRes.created ? "created" : "exists"} (attached ${openRes.modifiedCount})`
      );
    }
  }

  console.log(`\nGroups created: ${groupsCreated}, Courses attached: ${coursesAttached}`);

  console.log("\nVerification:");
  for (const dept of departments) {
    const semesters = await Semester.find({ department: dept._id }).sort({ name: 1 });
    for (const sem of semesters) {
      const groups = await ElectiveGroup.find({ semester: sem._id });
      const withGroupCounts = await Promise.all(
        groups.map(async (g) => ({
          name: g.name,
          type: g.type,
          count: await Course.countDocuments({ semester: sem._id, electiveGroup: g._id }),
        }))
      );
      const desc = withGroupCounts.map((g) => `${g.name}=${g.count}`).join(", ");
      console.log(`  ${dept.code.padEnd(4)} sem ${sem.name}: ${desc}`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
