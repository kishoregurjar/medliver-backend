const express = require('express');
const indexController = require("../controllers/indexController");
const { verifyDoctorToken } = require('../utils/jsonWebToken');
const {validate,validateQuery,loginDoctorValidation, changeDoctorePasswordSchema, forgetDoctorePasswordSchema,resetDoctorePasswordSchema} = require('../middleware/validation')

const router = express.Router();

router.post("/login-doctor", validate(loginDoctorValidation),indexController.doctorAuthController.loginDoctor);
router.get("/view-profile", verifyDoctorToken(), indexController.doctorAuthController.viewProfile);
router.put("/change-password", validate(changeDoctorePasswordSchema),verifyDoctorToken(), indexController.doctorAuthController.changePassword);
router.put("/forget-password",  validate(forgetDoctorePasswordSchema),indexController.doctorAuthController.forgetPassword);
router.put("/reset-password",validate(resetDoctorePasswordSchema), indexController.doctorAuthController.resetPassword);

module.exports = router;