const express = require("express");
const indexController = require("../controllers/indexController");

const router = express.Router();


router.post("/register-user", indexController.customerController.registerUser);
router.post("/verify-otp", indexController.customerController.verifyOtp);
router.post("/user-login", indexController.customerController.loginUser);
router.post("/forget-password", indexController.customerController.forgetPassword);
router.post("/verify-forget-password-otp", indexController.customerController.verifyForgetPasswordOtp);
router.post("/reset-password",indexController.customerController.resetPassword);


module.exports = router;