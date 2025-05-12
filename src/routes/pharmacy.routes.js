const express = require('express');
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require('../utils/jsonWebToken');
const router = express.Router();
const { uploadLicenceImagePharmacy } = require('../services/multer');
const { validate, validateQuery, createStockValidation, getStockByPharmacyIdValidation, getAllStockValidation, deleteStockValidation, updateStockValidation } = require('../middleware/validation');

/*=======================================StockRoute=================================== */

router.post("/create-stock", validate(createStockValidation), verifyAdminToken("pharmacy"), indexController.stockController.createStock)
router.get("/get-medicine-by-pharmacy-id", validateQuery(getStockByPharmacyIdValidation), verifyAdminToken("pharmacy"), indexController.stockController.getStockByPharmacyId)
router.get("/get-all-stock", verifyAdminToken("pharmacy"), validateQuery(getAllStockValidation), indexController.stockController.getAllStock)
router.put("/update-stock", verifyAdminToken("pharmacy"), validate(updateStockValidation), indexController.stockController.updateStock)
router.delete("/delete-stock", verifyAdminToken("pharmacy"), validateQuery(deleteStockValidation), indexController.stockController.deleteStock)



/*=======================================Order Route=================================== */

router.get('/get-all-assigned-orders', verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.getAllAssignedOrder);
router.put('/accept-reject-order', verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.acceptOrRejectOrder);
// router.get('/get-order-by-id', validateQuery(getOrderByIdValidation), verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.getOrderById);
// router.put('/cancel-order', validateQuery(getOrderByIdValidation), verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.cancleOrder);



module.exports = router;