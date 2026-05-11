const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/exam-duty").then(async () => {
  const result = await mongoose.connection.db
    .collection("users")
    .updateOne({ email: "admin@examduty.com" }, { $set: { isActive: true } });
  console.log("Admin reactivated:", result.modifiedCount);
  process.exit(0);
});
