const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyDeliveryPartnerToken } = require("../utils/jsonWebToken");


const router = express.Router();

router.post("/register-delivery-partner", indexController.deliveryPartnerController.registerDeliveryPartner);
router.post("/verify-otp-partner", indexController.deliveryPartnerController.verifyOtp);
router.post('/login-delivery-partner', indexController.deliveryPartnerController.loginDeliveryPartner);
router.get('/get-partner-profile', verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.viewProfile)

module.exports = router;