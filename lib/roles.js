// lib/roles.js

const checkRole = (user, allowedRoles = []) => {
  if (!user || !user.role) {
    throw { status: 403, message: 'Access denied: missing role information.' };
  }

  const role = String(user.role).toLowerCase();
  if (!allowedRoles.map((r) => r.toLowerCase()).includes(role)) {
    throw { status: 403, message: 'Access denied: insufficient permissions.' };
  }
  
  return true; // Validated
};

// Helper wrappers
const requireAdmin = (user) => checkRole(user, ['admin']);
const requireManager = (user) => checkRole(user, ['manager', 'admin']);

module.exports = {
  checkRole,
  requireAdmin,
  requireManager,
};