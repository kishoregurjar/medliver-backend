const express = require('express');
const indexController = require("../controllers/indexController");
const { verifyDoctorToken } = require('../utils/jsonWebToken');

const router = express.Router();

router.post("/login-doctor", indexController.doctorAuthController.loginDoctor);
router.get("/view-profile", verifyDoctorToken(), indexController.doctorAuthController.viewProfile);
router.put("/change-password", verifyDoctorToken(), indexController.doctorAuthController.changePassword);
router.put("/forget-password", indexController.doctorAuthController.forgetPassword);
router.put("/reset-password", indexController.doctorAuthController.resetPassword);

module.exports = router;