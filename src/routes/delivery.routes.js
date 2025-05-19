const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyDeliveryPartnerToken } = require("../utils/jsonWebToken");
const { uploadDeliveryProfile, uploadAdharcardImages, uploadLicenceImage, uploadRCCard } = require("../services/multer");
const { validate, validateQuery, registerDeliveryPartnerValidation, verifyOtpSchema, loginSchema, editDeliveryPartnerSchema, forgetPasswordSchema, changePasswordSchema, resetPasswordSchema, updateDeliveryPartnerStatusSchema, verifyForgotPasswordOtpSchema, getCompleteRouteDetailsSchema } = require("../middleware/validation")


const router = express.Router();
// 

router.post("/register-delivery-partner", validate(registerDeliveryPartnerValidation), indexController.deliveryPartnerController.registerDeliveryPartner);
router.post("/verify-otp-partner", validate(verifyOtpSchema), indexController.deliveryPartnerController.verifyOtp);
router.post('/login-delivery-partner', validate(loginSchema), indexController.deliveryPartnerController.loginDeliveryPartner);
router.get('/get-partner-profile', verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.viewProfile)
router.put('/update-partner-profile', validate(editDeliveryPartnerSchema), verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.editDeliveryPartner);
router.put('/change-password-partner', validate(changePasswordSchema), verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.changePassword);
router.put('/forget-password-delivery-partner', validate(forgetPasswordSchema), indexController.deliveryPartnerController.forgetPassword);
router.put('/reset-password-delivery-partner', validate(resetPasswordSchema), indexController.deliveryPartnerController.resetPassword);
router.post('/upload-delivery-partner-profile', uploadDeliveryProfile, indexController.deliveryPartnerController.uploadDeliveryProfile)
router.post('/upload-delivery-partner-adharcard', uploadAdharcardImages, indexController.deliveryPartnerController.uploadDeliveryAdharCardImages)
router.post('/upload-delivery-partner-licence', uploadLicenceImage, indexController.deliveryPartnerController.uploadLicence)
router.post('/upload-delivery-registration-card', uploadRCCard, indexController.deliveryPartnerController.uploadRcCard)
router.put('/update-delivery-partner-status', validate(updateDeliveryPartnerStatusSchema), verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.updateDeliveryPartnerStatus)
router.post('/verify-forgot-password-otp', validate(verifyForgotPasswordOtpSchema), indexController.deliveryPartnerController.verifyForgotPasswordOtp);

//==========================

router.post('/calculate-distance-rate', validate(getCompleteRouteDetailsSchema), indexController.deliveryPartnerController.getCompleteRouteDetailsForDeliveryPartner);

//************************ */

router.get('/get-requested-order', verifyDeliveryPartnerToken(), indexController.deliveryOrderController.getRequestedOrder);
router.get('/get-order-by-id', verifyDeliveryPartnerToken(), indexController.deliveryOrderController.getOrderById);
router.post("/accept-or-reject-order", verifyDeliveryPartnerToken(), indexController.deliveryOrderController.acceptRejectOrder);


// get notification routes
router.get('/get-notification-by-recipientId', verifyDeliveryPartnerToken(), indexController.commonController.getNotifications);
router.put('/update-notification-status', verifyDeliveryPartnerToken(), indexController.commonController.updateNotificationStatus);
router.get('/check-delivery-partner-currenct-status', verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.getDeliveryPartnerCurrentStatus);

/**  */

module.exports = router;