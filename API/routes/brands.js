const express = require("express");

const router = express.Router();
const authMiddleware = require('../middleware/auth');
const storeMiddleware = require('../middleware/store');
const { requireAdmin } = require('../middleware/roles');

const {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} =  require('../Controllers/brandsController');

// Require JWT auth then enforce store context for all brand routes
router.use(authMiddleware.verifyToken);
router.use(storeMiddleware.setStore);
router.use(requireAdmin());

router.get("/", getBrands);
router.post("/", createBrand);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);

module.exports = router;