const AppError = require("../utils/AppError");

/**
 * Route-level authorization guard. Runs after `protect` and rejects the
 * request unless the caller's active role is in the allowed list.
 *
 *   router.patch("/x", protect, requireRole("cs"), controller.x);
 *
 * Uses the token's `activeRole` (what the user is acting as right now),
 * not the full `roles` array — a user with multiple roles must have
 * selected the matching role via /auth/select-role to pass.
 */
module.exports = function requireRole(...allowed) {
  const set = new Set(allowed.flat());
  return (req, res, next) => {
    const active = req.user?.activeRole;
    if (!active || !set.has(active)) {
      return next(
        new AppError(
          `Not authorized — this action requires role: ${[...set].join(" or ")}`,
          403,
        ),
      );
    }
    next();
  };
};
