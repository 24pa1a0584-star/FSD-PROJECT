/**
 * Middleware to enforce strict gym-scoped isolation on backend
 */
const authorizeGymScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Super Admin has universal access across all campus facilities
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Find targeted gymId from query, params, or body
  const requestedGymId =
    req.params.gymId || req.query.gymId || (req.body && req.body.gymId);

  const userGymId = req.user.assignedGym ? req.user.assignedGym.toString() : null;

  if (!userGymId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: No gym facility assigned to your profile.',
    });
  }

  // If a specific gym is targeted, ensure it matches user's assigned facility
  if (requestedGymId) {
    if (requestedGymId.toString() !== userGymId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are strictly forbidden from accessing records of other gym facilities.',
      });
    }
  } else {
    // Automatically inject the assigned gym ID into query or body to guarantee isolation
    if (req.method === 'GET') {
      req.query.gymId = userGymId;
    } else if (req.body && typeof req.body === 'object') {
      req.body.gymId = userGymId;
    }
  }

  next();
};

module.exports = { authorizeGymScope };
