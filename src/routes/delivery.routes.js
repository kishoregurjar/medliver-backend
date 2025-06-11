const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyDeliveryPartnerToken } = require("../utils/jsonWebToken");
const { uploadDeliveryProfile, uploadAdharcardImages, uploadLicenceImage, uploadRCCard } = require("../services/multer");
const { validate, validateQuery, registerDeliveryPartnerValidation, verifyOtpSchema, loginSchema, editDeliveryPartnerSchema, forgetPasswordSchema, changePasswordSchema, resetPasswordSchema, updateDeliveryPartnerStatusSchema, verifyForgotPasswordOtpSchema, getCompleteRouteDetailsSchema,getRequestedOrderValidation ,getDeliveryOrderByIdValidation,acceptRejectOrderValidation} = require("../middleware/validation")


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

router.get('/get-requested-order', validateQuery(getRequestedOrderValidation),verifyDeliveryPartnerToken(), indexController.deliveryOrderController.getRequestedOrder);
router.get('/get-order-by-id', validateQuery(getDeliveryOrderByIdValidation),verifyDeliveryPartnerToken(), indexController.deliveryOrderController.getOrderById);
router.post("/accept-or-reject-order",validate(acceptRejectOrderValidation) ,verifyDeliveryPartnerToken(), indexController.deliveryOrderController.acceptRejectOrder);
router.put("/update-order-delivery-current-status" ,verifyDeliveryPartnerToken(), indexController.deliveryOrderController.updateDeliveryStatus);
router.put('/reached-assigned-pharmacy', verifyDeliveryPartnerToken(), indexController.deliveryOrderController.reachedPharmacy);

// get notification routes
router.get('/get-notification-by-recipientId', verifyDeliveryPartnerToken(), indexController.commonController.getNotifications);
router.put('/update-notification-status', verifyDeliveryPartnerToken(), indexController.commonController.updateNotificationStatus);
router.get('/check-delivery-partner-currenct-status', verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.getDeliveryPartnerCurrentStatus);
router.get("/get-notification-by-id", indexController.commonNotificationController.getNotificationById);

// privacy and terms routes

router.get("/get-privacy-policy",  indexController.commonPPAndTCContorller.getPrivacyPolicy);
router.get("/get-terms-and-conditions", indexController.commonPPAndTCContorller.getTermsAndConditions);

// Heartbeat routes
router.post("/send-heartbeat", verifyDeliveryPartnerToken(), indexController.deliveryPartnerController.saveDeliveryPartnerHeartbeat);

module.exports = router;