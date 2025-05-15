const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyUserToken } = require("../utils/jsonWebToken");
const { uploadUserProfilePic, uploadPrescription } = require("../services/multer");
const { validate, validateQuery, getAllSpecialOfferValidation, getAllFeatureProductValidation, getAllSellingProductValidation, createDoctorLeadValidation, registerCustomerSchema, CustomerverifyOtpSchema, loginCustomerSchema, forgetPasswordCustomerValidation, resetPasswordCustomerValidation, signUpSignInWithGoogleValidation, addAddressValidation, editAddressSchema, getOrDeleteCustomerAddress, addToCartSchema, changeQuantitySchema, removeItemFromCartSchema, applyInsuranceSchema, emergencyVehicleRequestSchema, updateUserProfileValidation, createOrderValidation, getOrderByIdValidation, createRazorpayOrderValidation, verifyRazorpayPaymentValidation, autoCompleteAddressValidation, getDistanceBetweenCoordsValidation, getRouteBetweenCoordsValidation, searchUMedicineValidation, logMedicineClickValidation } = require("../middleware/validation")

const router = express.Router();

/** Auth Route */


router.post("/register-user", validate(registerCustomerSchema), indexController.customerController.registerUser);
router.post("/verify-otp", validate(CustomerverifyOtpSchema), indexController.customerController.verifyOtp);
router.post("/user-login", validate(loginCustomerSchema), indexController.customerController.loginUser);
router.post("/forget-password", validate(forgetPasswordCustomerValidation), indexController.customerController.forgetPassword);
router.post("/verify-forget-password-otp", validate(CustomerverifyOtpSchema), indexController.customerController.verifyForgetPasswordOtp);
router.post("/reset-password", validate(resetPasswordCustomerValidation), indexController.customerController.resetPassword);
router.get("/get-user-details", verifyUserToken(), indexController.customerController.getUserDetails);
router.post("/change-password", verifyUserToken(), indexController.customerController.changeUserPassword);
router.patch("/update-user-profile", validate(updateUserProfileValidation), verifyUserToken(), indexController.customerController.updateUserProfile);
router.post("/update-user-profile-picture", verifyUserToken(), uploadUserProfilePic, indexController.customerController.updateUserProfilePicture);
router.post("signup-signin-with-google", validate, indexController.customerController.signUPSignInWithGoogle);

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
router.post("/apply-for-insurance", indexController.customerMissLiniesController.applyInsurance);
router.post("/request-for-emergency-vehicle", validate(emergencyVehicleRequestSchema), indexController.customerMissLiniesController.requestEmergencyVehicle)



/** Order Routes */
router.post("/create-order", validate(createOrderValidation), verifyUserToken(), indexController.customerOrderController.createOrder);
router.get("/get-all-orders", verifyUserToken(), indexController.customerOrderController.getAllOrders);
router.get("/get-order-by-id", validateQuery(getOrderByIdValidation), verifyUserToken(), indexController.customerOrderController.getOrderById);
router.put("/cancel-order", validateQuery(getOrderByIdValidation), verifyUserToken(), indexController.customerOrderController.cancleOrder);

/** Payment Routes */

router.post('/create-payment-order', validate(createRazorpayOrderValidation), indexController.customerPaymentController.createOrder);
router.post('/verify-payment', validate(verifyRazorpayPaymentValidation), indexController.customerPaymentController.verifyPayment);

/** Prescription */

router.post('/upload-prescription', verifyUserToken(), uploadPrescription, indexController.customerOrderController.uploadPrescription)

/** Map Integration */
router.post('/search-autocomplete-address', validate(autoCompleteAddressValidation), indexController.commonController.autoCompleteAddress);
router.post('/get-distance-between-coords', validate(getDistanceBetweenCoordsValidation), indexController.commonController.getDistanceBetweenCoords);
router.post('/get-routes-bw-coords', validate(getRouteBetweenCoordsValidation), indexController.commonController.getRouteBetweenCoords);

/**Medicine */
router.get('/search-medicine', validateQuery(searchUMedicineValidation), indexController.customerMedicineController.searchMedicine);
router.get("/get-all-medicines", indexController.medicineController.getAllMedicines);
router.get("/get-medicine-by-id", indexController.medicineController.getMedicineById);
router.post('/log-medicine-click', validate(logMedicineClickValidation), indexController.customerMedicineController.logMedicineClick);
router.get('/get-top-picks', indexController.customerMedicineController.getUserTopPicksWithSimilar)
router.get('/medicines-by-manufacturer', indexController.customerMedicineController.getMedicinesByManufacturer)

/**DoctoreLead Routes */
router.post("/create-doctoreLead", indexController.customerMissLiniesController.createDoctoreLead);
module.exports = router;

// get notification routes
router.get('/get-notification-by-recipientId',verifyUserToken(),indexController.commonController.getNotifications);
router.put('/update-notification-status',verifyUserToken(),indexController.commonController.updateNotificationStatus);