const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require("../utils/jsonWebToken");
const router = express.Router();

router.post("/admin-login",indexController.adminController.login);
router.get("/get-admin-details", verifyAdminToken(), indexController.adminController.getAdminDetails);
router.post("/forget-password", indexController.adminController.forgetPassword);
router.post("/reset-password", indexController.adminController.resetPassword);
router.post("/changed-password", verifyAdminToken(), indexController.adminController.changedPassword);
router.patch("/update-admin-profile", verifyAdminToken(), indexController.adminController.updateAdminProfile);



/*=======================================PharmacyRoute=================================== */
router.post("/create-pharmacy",indexController.pharmacyController.createPharmacy)
router.get("/get-pharmacy-by-id",verifyAdminToken("superadmin"),indexController.pharmacyController.getPharmacyById)
router.put("/update-pharmacy",verifyAdminToken("pharmacy"),indexController.pharmacyController.updatePharmacy)
router.delete("/delete-pharmacy",verifyAdminToken("superadmin"),indexController.pharmacyController.deletePharmacy)
/*=======================================PathelogyRoute=================================== */
module.exports = router;