const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require("../utils/jsonWebToken");
const { validate, validateQuery, createPharmacy, getAndDeletePharmacyById, getAllPharmacy, updatePharmacy } = require('../middleware/validation');
const router = express.Router();

/** Super Admin Auth Routes */

router.post("/admin-login", indexController.adminController.login);
router.get("/get-admin-details", verifyAdminToken(), indexController.adminController.getAdminDetails);
router.post("/forget-password", indexController.adminController.forgetPassword);
router.post("/reset-password", indexController.adminController.resetPassword);
router.post("/changed-password", verifyAdminToken(), indexController.adminController.changedPassword);
router.patch("/update-admin-profile", verifyAdminToken(), indexController.adminController.updateAdminProfile);

/** Super Admin Pathology Routes */

router.post("/create-pathology", verifyAdminToken("superadmin"), indexController.pathologyController.createPathologyCenter)
router.get("/get-pathology-by-id", verifyAdminToken("superadmin"), indexController.pathologyController.getPathologyCenterById)
router.get("/get-all-pathology", verifyAdminToken("superadmin"), indexController.pathologyController.getAllPathologyCenters)
router.put("/update-pathology", verifyAdminToken("superadmin"), indexController.pathologyController.updatePathologyCenter)
router.delete("/delete-pathology", verifyAdminToken("superadmin"), indexController.pathologyController.deletePathologyCenter)
router.get("/search-pathology",verifyAdminToken("superadmin"),indexController.pathologyController.searchPathology)
/** Super Admin Pharmacy Routes */


router.post("/create-pharmacy", verifyAdminToken("superadmin"), validate(createPharmacy), indexController.pharmacyController.createPharmacy)
router.get("/get-pharmacy-by-id", validateQuery(getAndDeletePharmacyById), verifyAdminToken("superadmin"), indexController.pharmacyController.getPharmacyById)
router.put("/update-pharmacy", validate(updatePharmacy), verifyAdminToken("pharmacy"), indexController.pharmacyController.updatePharmacy)
router.delete("/delete-pharmacy", validateQuery(getAndDeletePharmacyById), verifyAdminToken("superadmin"), indexController.pharmacyController.deletePharmacy)
router.get("/get-all-pharmacy", validateQuery(getAllPharmacy), verifyAdminToken("superadmin"), indexController.pharmacyController.getAllPharmacy);
router.get("/search-pharmacy", verifyAdminToken("superadmin"), indexController.pharmacyController.searchPharmacy)

/** Super Admin Delivery Partner Routes */

router.put('/approve-delivery-partner', verifyAdminToken('superadmin'), indexController.adminController.approveDeliveryPartner)



module.exports = router;