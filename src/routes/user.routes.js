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

/** Featue and selling and special offer Routes */

router.get("/get-all-feature-product", validateQuery(getAllFeatureProductValidation), verifyUserToken(), indexController.customerController.getAllFeaturedProducts)
router.get("/get-all-best-selling-product", validateQuery(getAllSellingProductValidation), verifyUserToken(), indexController.customerController.getAllBestSellingProduct);
router.get("/get-all-special-offer", validateQuery(getAllSpecialOfferValidation), verifyUserToken(), indexController.customerController.getallSpecialOffers)

/** Cart Routes */
router.post('/add-to-cart', verifyUserToken(), indexController.customerCartController.addToCart);
router.get('/get-cart', verifyUserToken(), indexController.customerCartController.getCart);
router.put('/change-cart-product-quantity', verifyUserToken(), indexController.customerCartController.changeQuantity);
router.put('/remove-item-from-cart', verifyUserToken(), indexController.customerCartController.removeItemFromCart);


module.exports = router;