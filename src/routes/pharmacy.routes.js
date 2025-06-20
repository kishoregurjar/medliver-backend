const express = require('express');
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require('../utils/jsonWebToken');
const router = express.Router();
const { uploadLicenceImagePharmacy } = require('../services/multer');
const { validate, validateQuery, getAllApiValidation, createStockValidation, getStockByPharmacyIdValidation,searchMedicineValidation, getAllStockValidation, deleteStockValidation, updateStockValidation } = require('../middleware/validation');

/*=======================================StockRoute=================================== */

router.post("/create-stock", validate(createStockValidation), verifyAdminToken("pharmacy"), indexController.stockController.createStock)
router.get("/get-medicine-by-pharmacy-id", verifyAdminToken("pharmacy"), indexController.stockController.getStockByPharmacyId)
router.get("/get-all-stock", verifyAdminToken("pharmacy"), validateQuery(getAllStockValidation), indexController.stockController.getAllStock)
router.put("/update-stock", verifyAdminToken("pharmacy"), validate(updateStockValidation), indexController.stockController.updateStock)
router.delete("/delete-stock", verifyAdminToken("pharmacy"), validateQuery(deleteStockValidation), indexController.stockController.deleteStock)
router.get("/search-stock", verifyAdminToken("pharmacy"), indexController.stockController.searchStock)

/*=======================================Order Route=================================== */

router.get('/get-all-assigned-orders', verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.getAllAssignedOrder);
router.put('/accept-reject-order', verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.acceptOrRejectOrder);
// router.get('/get-order-by-id', validateQuery(getOrderByIdValidation), verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.getOrderById);
// router.put('/cancel-order', validateQuery(getOrderByIdValidation), verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.cancleOrder);
router.get('/search-pharmacy-order', verifyAdminToken('pharmacy'), indexController.pharmacyOrderController.searchPharmacyOrder);
router.get('/get-all-orders-details-by-id', verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.getAllDetailsOfOrdersById)

// get notification routes
router.get('/get-notification-by-recipientId', verifyAdminToken("pharmacy"), indexController.commonController.getNotifications);
router.put('/update-notification-status', verifyAdminToken("pharmacy"), indexController.commonController.updateNotificationStatus);
router.get('/order-accepted-by-pharmacy', verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.getAcceptedOrdersByPharmacy)


//privacy and terms routes
router.get("/get-privacy-policy", indexController.commonPPAndTCContorller.getPrivacyPolicy);
router.get("/get-terms-and-conditions", indexController.commonPPAndTCContorller.getTermsAndConditions);

//prescription management

router.get('/get-assigned-prescription', verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.getAssignedPrescriptionOrder);
router.post('/accept-reject-prescription', verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.acceptOrRejectPrecription);
router.get("/search-medicine", validateQuery(searchMedicineValidation), verifyAdminToken("pharmacy"), indexController.medicineController.searchMedicine);
router.get("/get-all-medicines", validateQuery(getAllApiValidation), verifyAdminToken("pharmacy"), indexController.medicineController.getAllMedicines);

router.get('/search-prescription-by-status', verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.searchPrescriptionsByStatus);
router.get('/search-orders-by-status', verifyAdminToken("pharmacy"), indexController.pharmacyOrderController.searchOrdersByStatus)
router.post("/create-invoice-for-prescription", verifyAdminToken('pharmacy'), indexController.pharmacyOrderController.createInvoiceForPrescription);

// Toggle availability status 
router.put("/change-availability-status", verifyAdminToken('pharmacy'), indexController.pharmacyController.changePharmacyAvailabilityStatus);

/** Payment Management */
router.get('/get-all-payments', verifyAdminToken("pharmacy"), indexController.pharmacyPaymentController.getAllPayments);

module.exports = router;