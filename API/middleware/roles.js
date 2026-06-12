const requireRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Access denied: missing role information.' });
    }

    const role = String(req.user.role).toLowerCase();
    if (!allowedRoles.map((r) => r.toLowerCase()).includes(role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions.' });
    }

    return next();
  };
};

const requireAdmin = () => requireRoles(['admin']);
const requireManager = () => requireRoles(['manager', 'admin']);

module.exports = {
  requireRoles,
  requireAdmin,
  requireManager,
};
