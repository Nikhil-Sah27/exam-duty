// Variant of `protect` that permits tokens whose payload has no activeRole yet.
// Only used by POST /auth/select-role, which is the endpoint that promotes a
// tempToken into a role-bound token.
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const allowUnselectedRole = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Not authorized — no token", 401));
  }
  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, activeRole: decoded.activeRole || null };
    next();
  } catch {
    next(new AppError("Not authorized — invalid token", 401));
  }
};

module.exports = allowUnselectedRole;
