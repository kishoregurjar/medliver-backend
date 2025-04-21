const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyDeliveryPartnerToken } = require("../utils/jsonWebToken");
const { uploadDeliveryProfile, uploadAdharcardImages, uploadLicenceImage } = require("../services/multer");


const router = express.Router();

router.post("/register-delivery-partner", indexController.deliveryPartnerController.registerDeliveryPartner);
router.post("/verify-otp-partner", indexController.deliveryPartnerController.verifyOtp);
router.post('/login-delivery-partner', indexController.deliveryPartnerController.loginDeliveryPartner);
router.get('/get-partner-profile', verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.viewProfile)
router.put('/update-partner-profile', verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.editDeliveryPartner);
router.put('/change-password-partner', verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.changePassword);
router.put('/forget-password-delivery-partner', indexController.deliveryPartnerController.forgetPassword);
router.put('/reset-password-delivery-partner', indexController.deliveryPartnerController.resetPassword);
router.post('/upload-delivery-partner-profile', uploadDeliveryProfile, indexController.deliveryPartnerController.uploadDeliveryProfile)
router.post('/upload-delivery-partner-adharcard', uploadAdharcardImages, indexController.deliveryPartnerController.uploadDeliveryAdharCardImages)
router.post('/upload-delivery-partner-licence', uploadLicenceImage, indexController.deliveryPartnerController.uploadLicence)
router.put('/update-delivery-partner-status', verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.updateDeliveryPartnerStatus)

module.exports = router;