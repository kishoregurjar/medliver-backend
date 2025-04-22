const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyUserToken } = require("../utils/jsonWebToken");
const { uploadUserProfilePic } = require("../services/multer");

const router = express.Router();


router.post("/register-user", indexController.customerController.registerUser);
router.post("/verify-otp", indexController.customerController.verifyOtp);
router.post("/user-login", indexController.customerController.loginUser);
router.post("/forget-password", indexController.customerController.forgetPassword);
router.post("/verify-forget-password-otp", indexController.customerController.verifyForgetPasswordOtp);
router.post("/reset-password",indexController.customerController.resetPassword);
router.get("/get-user-details", verifyUserToken(), indexController.customerController.getUserDetails);
router.post("/change-password", verifyUserToken(), indexController.customerController.changeUserPassword);
router.patch("/update-user-profile", verifyUserToken(), indexController.customerController.updateUserProfile);
router.post("/update-user-profile-picture", verifyUserToken(), uploadUserProfilePic, indexController.customerController.updateUserProfilePicture);
router.post("signup-signin-with-google", indexController.customerController.signUPSignInWithGoogle);

module.exports = router;