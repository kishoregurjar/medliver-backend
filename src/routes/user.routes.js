const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyUserToken } = require("../utils/jsonWebToken");
const { uploadUserProfilePic } = require("../services/multer");
const { validate, validateQuery, getAllSpecialOfferValidation, getAllFeatureProductValidation, getAllSellingProductValidation, } = require("../middleware/validation")

const router = express.Router();

/** Auth Route */


router.post("/register-user", indexController.customerController.registerUser);
router.post("/verify-otp", indexController.customerController.verifyOtp);
router.post("/user-login", indexController.customerController.loginUser);
router.post("/forget-password", indexController.customerController.forgetPassword);
router.post("/verify-forget-password-otp", indexController.customerController.verifyForgetPasswordOtp);
router.post("/reset-password", indexController.customerController.resetPassword);
router.get("/get-user-details", verifyUserToken(), indexController.customerController.getUserDetails);
router.post("/change-password", verifyUserToken(), indexController.customerController.changeUserPassword);
router.patch("/update-user-profile", verifyUserToken(), indexController.customerController.updateUserProfile);
router.post("/update-user-profile-picture", verifyUserToken(), uploadUserProfilePic, indexController.customerController.updateUserProfilePicture);
router.post("signup-signin-with-google", indexController.customerController.signUPSignInWithGoogle);

/** Address Routes */
router.post("/add-address", verifyUserToken(), indexController.customerController.addAddress);
router.get("/get-all-address", verifyUserToken(), indexController.customerController.getAllAddress);
router.put("/edit-address", verifyUserToken(), indexController.customerController.editAddress);
router.delete("/delete-address", verifyUserToken(), indexController.customerController.deleteAddress);
router.get('/get-address-by-id', verifyUserToken(), indexController.customerController.getAddressById);
router.put('/set-default-address', verifyUserToken(), indexController.customerController.setDefaultAddress);

/** Featue and selling and special offer Routes */

router.get("/get-all-feature-product", validateQuery(getAllFeatureProductValidation), verifyUserToken(), indexController.customerSpecialProductController.getAllFeaturedProducts)
router.get("/get-all-selling-product", validateQuery(getAllSellingProductValidation), verifyUserToken(), indexController.customerSpecialProductController.getAllSellingProduct);
router.get("/get-all-special-offer", validateQuery(getAllSpecialOfferValidation), verifyUserToken(), indexController.customerSpecialProductController.getallSpecialOffers)

/** Cart Routes */
router.post('/add-to-cart', verifyUserToken(), indexController.customerCartController.addToCart);
router.get('/get-cart', verifyUserToken(), indexController.customerCartController.getCart);
router.put('/change-cart-product-quantity', verifyUserToken(), indexController.customerCartController.changeQuantity);
router.put('/remove-item-from-cart', verifyUserToken(), indexController.customerCartController.removeItemFromCart);

/** Insurance route */
router.post("/apply-for-insurance",verifyUserToken(),indexController.customerMissLiniesController.applyInsurance);
router.post("/request-for-emergency-vehicle",indexController.customerMissLiniesController.requestEmergencyVehicle)


/** Order Routes */
router.post("/create-order", verifyUserToken(), indexController.customerOrderController.createOrder);
router.get("/get-all-orders", verifyUserToken(), indexController.customerOrderController.getAllOrders);
router.get("/get-order-by-id", verifyUserToken(), indexController.customerOrderController.getOrderById);
router.put("/cancel-order", verifyUserToken(), indexController.customerOrderController.cancleOrder);
module.exports = router;