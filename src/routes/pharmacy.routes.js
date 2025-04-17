const express = require('express');
const indexController = require("../controllers/indexController");
const {validate,validateQuery,createPharmacy,getAndDeletePharmacyById,getAllPharmacy,updatePharmacy} = require('../middleware/validation');
const { verifyAdminToken } = require('../utils/jsonWebToken');
const router = express.Router();

router.get("/pharmacy", (req, res) => {
    res.send("pharmacy route is working");
});



router.post("/create-pharmacy",verifyAdminToken("superadmin"),validate(createPharmacy),indexController.pharmacyController.createPharmacy)
router.get("/get-pharmacy-by-id",validateQuery(getAndDeletePharmacyById),verifyAdminToken("superadmin"),indexController.pharmacyController.getPharmacyById)
router.put("/update-pharmacy",validate(updatePharmacy),verifyAdminToken("pharmacy"),indexController.pharmacyController.updatePharmacy)
router.delete("/delete-pharmacy",validateQuery(getAndDeletePharmacyById),verifyAdminToken("superadmin"),indexController.pharmacyController.deletePharmacy)
router.get("/get-all-pharmacy",validateQuery(getAllPharmacy),verifyAdminToken("superadmin"),indexController.pharmacyController.getAllPharmacy);
router.get("/search-pharmacy",verifyAdminToken("superadmin"),indexController.pharmacyController.searchPharmacy)



/*=======================================StockRoute=================================== */

router.post("/create-stock",verifyAdminToken("pharmacy"),indexController.stockController.createStock)
router.get("/get-medicine-by-pharmacy-id",verifyAdminToken("pharmacy"),indexController.stockController.getStockByPharmacyId)
router.get("/get-all-stock",verifyAdminToken("pharmacy"),indexController.stockController.getAllStock)
router.put("/update-stock",verifyAdminToken("pharmacy"),indexController.stockController.updateStock)
// router.delete("/delete-stock",verifyAdminToken("pharmacy"),indexController.stockController.)


module.exports = router;