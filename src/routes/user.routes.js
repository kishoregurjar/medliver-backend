const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyUserToken } = require("../utils/jsonWebToken");
const { uploadUserProfilePic, uploadPrescription } = require("../services/multer");
const { validate, validateQuery, getAllSpecialOfferValidation, getAllFeatureProductValidation, getAllSellingProductValidation, createDoctorLeadValidation, registerCustomerSchema, CustomerverifyOtpSchema, loginCustomerSchema, forgetPasswordCustomerValidation, resetPasswordCustomerValidation, signUpSignInWithGoogleValidation, addAddressValidation, editAddressSchema, getOrDeleteCustomerAddress, addToCartSchema, changeQuantitySchema, removeItemFromCartSchema, emergencyVehicleRequestSchema, updateUserProfileValidation, createOrderValidation, getOrderByIdValidation, createRazorpayOrderValidation, verifyRazorpayPaymentValidation, autoCompleteAddressValidation, getDistanceBetweenCoordsValidation, getRouteBetweenCoordsValidation, searchUMedicineValidation, logMedicineClickValidation, searchOrderValidation, createDoctoreLeadValidation, applyInsuranceValidation, getMedicinesByManufacturerValidation, getAllOrdersValidation, getprescriptionByIdValidation, changeUserPasswordValidation, getTestsByCategoryId, getTestsDetailsById, populatTestApiValidation, searchTest } = require("../middleware/validation")

const router = express.Router();

/** Auth Route */


router.post("/register-user", validate(registerCustomerSchema), indexController.customerController.registerUser);
router.post("/verify-otp", validate(CustomerverifyOtpSchema), indexController.customerController.verifyOtp);
router.post("/user-login", validate(loginCustomerSchema), indexController.customerController.loginUser);
router.post("/forget-password", validate(forgetPasswordCustomerValidation), indexController.customerController.forgetPassword);
router.post("/verify-forget-password-otp", validate(CustomerverifyOtpSchema), indexController.customerController.verifyForgetPasswordOtp);
router.post("/reset-password", validate(resetPasswordCustomerValidation), indexController.customerController.resetPassword);
router.get("/get-user-details", verifyUserToken(), indexController.customerController.getUserDetails);
router.post("/change-password", verifyUserToken(), validate(changeUserPasswordValidation), indexController.customerController.changeUserPassword);
router.patch("/update-user-profile", validate(updateUserProfileValidation), verifyUserToken(), indexController.customerController.updateUserProfile);
router.post("/update-user-profile-picture", verifyUserToken(), uploadUserProfilePic, indexController.customerController.updateUserProfilePicture);
router.post("signup-signin-with-google", validate(signUpSignInWithGoogleValidation), indexController.customerController.signUPSignInWithGoogle);

/** Address Routes */
router.post("/add-address", validate(addAddressValidation), verifyUserToken(), indexController.customerController.addAddress);
router.get("/get-all-address", verifyUserToken(), indexController.customerController.getAllAddress);
router.put("/edit-address", validate(editAddressSchema), verifyUserToken(), indexController.customerController.editAddress);
router.delete("/delete-address", validateQuery(getOrDeleteCustomerAddress), verifyUserToken(), indexController.customerController.deleteAddress);
router.get('/get-address-by-id', validateQuery(getOrDeleteCustomerAddress), verifyUserToken(), indexController.customerController.getAddressById);
router.put('/set-default-address', validate(getOrDeleteCustomerAddress), verifyUserToken(), indexController.customerController.setDefaultAddress);

/** Featue and selling and special offer Routes */

router.get("/get-all-feature-product", validateQuery(getAllFeatureProductValidation), indexController.customerSpecialProductController.getAllFeaturedProducts)
router.get("/get-all-top-selling-product", validateQuery(getAllSellingProductValidation), indexController.customerSpecialProductController.getAllSellingProduct);
router.get("/get-all-special-offer", validateQuery(getAllSpecialOfferValidation), indexController.customerSpecialProductController.getallSpecialOffers)

/** Cart Routes */
router.post('/add-to-cart', validate(addToCartSchema), verifyUserToken(), indexController.customerCartController.addToCart);
router.get('/get-cart', verifyUserToken(), indexController.customerCartController.getCart);
router.put('/change-cart-product-quantity', validate(changeQuantitySchema), verifyUserToken(), indexController.customerCartController.changeQuantity);
router.put('/remove-item-from-cart', validate(removeItemFromCartSchema), verifyUserToken(), indexController.customerCartController.removeItemFromCart);

/** Insurance route */
router.post("/apply-for-insurance", validate(applyInsuranceValidation), indexController.customerMissLiniesController.applyInsurance);
router.post("/request-for-emergency-vehicle", validate(emergencyVehicleRequestSchema), indexController.customerMissLiniesController.requestEmergencyVehicle)



/** Order Routes */
router.post("/create-order", validate(createOrderValidation), verifyUserToken(), indexController.customerOrderController.createOrder);
router.get("/get-all-orders", verifyUserToken(), validateQuery(getAllOrdersValidation), indexController.customerOrderController.getAllOrders);
router.get("/get-order-by-id", validateQuery(getOrderByIdValidation), verifyUserToken(), indexController.customerOrderController.getOrderById);
router.put("/cancel-order", validateQuery(getOrderByIdValidation), verifyUserToken(), indexController.customerOrderController.cancleOrder);
router.get('/search-order', validateQuery(searchOrderValidation), verifyUserToken(), indexController.customerOrderController.searchOrder);

/** Payment Routes */

router.post('/create-payment-order', validate(createRazorpayOrderValidation), indexController.customerPaymentController.createOrder);
router.post('/verify-payment', validate(verifyRazorpayPaymentValidation), indexController.customerPaymentController.verifyPayment);

/** Prescription */

router.post('/upload-prescription', verifyUserToken(), uploadPrescription, indexController.customerOrderController.uploadPrescription)
router.get("/get-all-prescriptions", verifyUserToken(), indexController.customerOrderController.getAllPrescriptions);
router.get("/get-prescription-details-by-id", validateQuery(getprescriptionByIdValidation), verifyUserToken(), indexController.customerOrderController.getPrescriptionDetailsById);

/** Map Integration */
router.post('/search-autocomplete-address', validate(autoCompleteAddressValidation), indexController.commonController.autoCompleteAddress);
router.post('/get-distance-between-coords', validate(getDistanceBetweenCoordsValidation), indexController.commonController.getDistanceBetweenCoords);
router.post('/get-routes-bw-coords', validate(getRouteBetweenCoordsValidation), indexController.commonController.getRouteBetweenCoords);
router.get('/get-address-by-pincode', indexController.commonController.getAddressByPincode);

/**Medicine */
router.get('/search-medicine', validateQuery(searchUMedicineValidation), indexController.customerMedicineController.searchMedicine);
router.get("/get-all-medicines", indexController.medicineController.getAllMedicines);
router.get("/get-medicine-by-id", indexController.medicineController.getMedicineById);
router.post('/log-medicine-click', validate(logMedicineClickValidation), indexController.customerMedicineController.logMedicineClick);
router.get('/get-top-picks', indexController.customerMedicineController.getUserTopPicksWithSimilar)
router.get('/medicines-by-manufacturer', validateQuery(getMedicinesByManufacturerValidation), indexController.customerMedicineController.getMedicinesByManufacturer)

/**DoctoreLead Routes */
router.post("/create-doctoreLead", validate(createDoctoreLeadValidation), indexController.customerMissLiniesController.createDoctoreLead);
module.exports = router;

// get notification routes
router.get('/get-notification-by-recipientId', verifyUserToken(), indexController.commonController.getNotifications);
router.put('/update-notification-status', verifyUserToken(), indexController.commonController.updateNotificationStatus);
router.post("/save-notification-id", indexController.commonNotificationController.saveNotificationId);

router.post('/get-automated-answer', indexController.chatBoatController.getAnswer);
router.get('/chat-history', indexController.chatBoatController.getChatBoatHistory);

//privacy and terms routes
router.get("/get-privacy-policy", indexController.commonPPAndTCContorller.getPrivacyPolicy);
router.get("/get-terms-and-conditions", indexController.commonPPAndTCContorller.getTermsAndConditions);

// customer test orderController
router.get('/get-popular-test', validateQuery(populatTestApiValidation), verifyUserToken(), indexController.customerTestOrderController.popularTest);
// router.get('/get-tests-by-category',verifyUserToken(),indexController.customerTestOrderController.getTestsByCategory);
router.get('/get-tests-by-category', validateQuery(getTestsByCategoryId), verifyUserToken(), indexController.customerTestOrderController.getTestsByCategoryId);
router.get('/search-test', validateQuery(searchTest), verifyUserToken(), indexController.adminTestController.searchTest)
router.get('/get-test-details', validateQuery(getTestsDetailsById), verifyUserToken(), indexController.customerTestOrderController.getTestDetails)


/** test booking managemennt */

router.post("/test-booking", verifyUserToken(), indexController.customerTestOrderController.createPathologyOrder);
router.post('/cancel-pathology-booking-from-user', verifyUserToken(), indexController.customerTestOrderController.cancelOrderFromUser);
router.get('/get-orders-pathology', verifyUserToken(), indexController.customerTestOrderController.getOrdersPathology);
router.get('/get-order-details-pathology', verifyUserToken(), indexController.customerTestOrderController.getOrderDetailsPathology);
router.get('/search-orders-pathology', verifyUserToken(), indexController.customerTestOrderController.searchOrdersPathology);
router.post("/test-booking", verifyUserToken(), indexController.customerTestOrderController.createPathologyOrder);
router.post('/test-log-click', indexController.customerTestOrderController.logTestClick);
router.get('/get-top-test-picks-for-user', indexController.customerTestOrderController.getLogHistoryTest);


/** Banners  */

router.get('/get-all-banners', indexController.promoBannerController.getAllPromoBanners);


/**  special test offer */

router.get("/get-special-test-offer", indexController.specialTestOfferController.getSpecialTestOffer);

