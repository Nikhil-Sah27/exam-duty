// Re-export the shared User model from auth module.
// Single User collection — auth owns the schema, user module owns profile CRUD.
module.exports = require("../auth/auth.model");
