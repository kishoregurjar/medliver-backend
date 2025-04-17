const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require("../utils/jsonWebToken");
const router = express.Router();
const {validate,validateQuery,createPharmacy,getAndDeletePharmacyById,getAllPharmacy,updatePharmacy} = require('../middleware/validation');

router.post("/admin-login",indexController.adminController.login);
router.get("/get-admin-details", verifyAdminToken(), indexController.adminController.getAdminDetails);
router.post("/forget-password", indexController.adminController.forgetPassword);
router.post("/reset-password", indexController.adminController.resetPassword);
router.post("/changed-password", verifyAdminToken(), indexController.adminController.changedPassword);
router.patch("/update-admin-profile", verifyAdminToken(), indexController.adminController.updateAdminProfile);



/*=======================================PharmacyRoute=================================== */
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


/*=======================================PathelogyRoute=================================== */
router.post("/create-pathology",verifyAdminToken("superadmin"),indexController.pathologyController.createPathologyCenter)
router.get("/get-pathology-by-id",verifyAdminToken("superadmin"),indexController.pathologyController.getPathologyCenterById)
router.get("/get-all-pathology",verifyAdminToken("superadmin"),indexController.pathologyController.getAllPathologyCenters)
router.put("/update-pathology",verifyAdminToken("superadmin"),indexController.pathologyController.updatePathologyCenter)
router.delete("/delete-pathology",verifyAdminToken("superadmin"),indexController.pathologyController.deletePathologyCenter)




module.exports = router;