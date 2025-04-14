const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require("../utils/jsonWebToken");
const router = express.Router();

router.post("/admin-login",indexController.adminController.login);
router.get("/get-admin-details", verifyAdminToken(), indexController.adminController.getAdminDetails);
router.post("/forget-password", indexController.adminController.forgetPassword);
router.post("/reset-password", indexController.adminController.resetPassword);


module.exports = router;