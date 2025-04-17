const express = require('express');
const indexController = require("../controllers/indexController");
const { validate, validateQuery, createPharmacy, getAndDeletePharmacyById, getAllPharmacy, updatePharmacy } = require('../middleware/validation');
const { verifyAdminToken } = require('../utils/jsonWebToken');
const router = express.Router();

/*=======================================StockRoute=================================== */

router.post("/create-stock", verifyAdminToken("pharmacy"), indexController.stockController.createStock)
router.get("/get-medicine-by-pharmacy-id", verifyAdminToken("pharmacy"), indexController.stockController.getStockByPharmacyId)
router.get("/get-all-stock", verifyAdminToken("pharmacy"), indexController.stockController.getAllStock)
router.put("/update-stock", verifyAdminToken("pharmacy"), indexController.stockController.updateStock)
router.delete("/delete-stock",verifyAdminToken("pharmacy"),indexController.stockController.deleteStock)


module.exports = router;