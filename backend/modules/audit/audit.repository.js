const AuditLog = require("./audit.model");

const create = (data) => AuditLog.create(data);

const findAll = (filter = {}) =>
  AuditLog.find(filter)
    .populate({ path: "performedBy", select: "name email" })
    .sort({ createdAt: -1 });

const findById = (id) =>
  AuditLog.findById(id).populate({ path: "performedBy", select: "name email" });

module.exports = { create, findAll, findById };
