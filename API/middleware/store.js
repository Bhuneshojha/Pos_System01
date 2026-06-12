// Middleware to resolve store_id from authenticated user or header
module.exports = {
  setStore: (req, res, next) => {
    // Prefer store id from authenticated user (req.user.store_id)
    if (req.user && req.user.store_id) {
      req.store_id = parseInt(req.user.store_id, 10);
      return next();
    }

    // Fallback: accept X-Store-Id header for environments without auth (must be integer)
    const storeHeader = req.headers['x-store-id'] || req.headers['x_store_id'];
    if (storeHeader) {
      const storeId = parseInt(storeHeader, 10);
      if (!Number.isNaN(storeId)) {
        req.store_id = storeId;
        return next();
      }
    }

    // If missing, block the request — forcing callers to provide tenancy context
    return res.status(400).json({ error: 'Missing store context (store_id). Provide via auth or X-Store-Id header.' });
  }
};
