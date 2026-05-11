const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const protect = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Not authorized — no token", 401));
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch {
    next(new AppError("Not authorized — invalid token", 401));
  }
};

module.exports = protect;
