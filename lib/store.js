// lib/store.js

module.exports = {
  resolveStoreId: (user, headers) => {
    // 1. Authenticated user se priority lein
    if (user && user.store_id) {
      return parseInt(user.store_id, 10);
    }

    // 2. Fallback: X-Store-Id header check karein
    const storeHeader = headers['x-store-id'] || headers['x_store_id'];
    if (storeHeader) {
      const storeId = parseInt(storeHeader, 10);
      if (!Number.isNaN(storeId)) {
        return storeId;
      }
    }

    // 3. Agar kuch nahi mila, toh error throw karein
    const error = new Error('Missing store context (store_id). Provide via auth or X-Store-Id header.');
    error.status = 400;
    throw error;
  }
};