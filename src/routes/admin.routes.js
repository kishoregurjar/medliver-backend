const express = require("express");
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require("../utils/jsonWebToken");
const { validate, validateQuery, createPharmacy, getAndDeletePharmacyById, getAllPharmacy, updatePharmacy ,createPathologyCenter,getAndDeletePathologyCenterById,updatePathologyCenter,searchPathologyCenter,createFeature, getOrDeleteFeatureById,updateFeatureStatus,getAllFeatures,registerDeliveryPartner,getOrDeleteDeliveryPartner,updateDeliveryPartner,updateDeliveryPartnerStatus,getAllDeliveryPartners,blockUnblockDeliveryPartner,getAllCustomersValidation, getCustomerByIdValidation,createTestValidation,getTestdeleteAndById, getAllApiValidation, searchTestValidation, updateTestValidation} = require('../middleware/validation');
const router = express.Router();
const { uploadAdminProfile, uploadLicenceImagePharmacy, uploadMedicineImages,uploadTestCatgPic } = require('../services/multer');
const { updateTest } = require("../controllers/AdminController/adminTestController");

/** Super Admin Auth Routes */

router.post("/admin-login", indexController.adminAuthController.login);
router.get("/get-admin-details", verifyAdminToken(), indexController.adminAuthController.getAdminDetails);
router.post("/forget-password", indexController.adminAuthController.forgetPassword);
router.post("/reset-password", indexController.adminAuthController.resetPassword);
router.post("/changed-password", verifyAdminToken(), indexController.adminAuthController.changedPassword);
router.patch("/update-admin-profile", verifyAdminToken(), indexController.adminAuthController.updateAdminProfile);

/** Upload files */
router.post('/upload-image', uploadAdminProfile, verifyAdminToken(), indexController.adminAuthController.uploadAdminAvatar);

/** Super Admin Pathology Routes */

router.post("/create-pathology", validate(createPathologyCenter),verifyAdminToken("superadmin"), indexController.adminPathologyController.createPathologyCenter)
router.get("/get-pathology-by-id", validateQuery(getAndDeletePathologyCenterById),verifyAdminToken("superadmin"), indexController.adminPathologyController.getPathologyCenterById)
router.get("/get-all-pathology", verifyAdminToken("superadmin"), indexController.adminPathologyController.getAllPathologyCenters)
router.put("/update-pathology", validate(updatePathologyCenter),verifyAdminToken("superadmin"), indexController.adminPathologyController.updatePathologyCenter)
router.delete("/delete-pathology",validateQuery(getAndDeletePathologyCenterById), verifyAdminToken("superadmin"), indexController.adminPathologyController.deletePathologyCenter)
router.get("/search-pathology", validateQuery(searchPathologyCenter),verifyAdminToken("superadmin"), indexController.adminPathologyController.searchPathology)
/** Super Admin Pharmacy Routes */

router.post("/create-pharmacy", verifyAdminToken("superadmin"), validate(createPharmacy), indexController.adminPharmacyController.createPharmacy)
router.get("/get-pharmacy-by-id", validateQuery(getAndDeletePharmacyById), verifyAdminToken("superadmin"), indexController.adminPharmacyController.getPharmacyById)
router.put("/update-pharmacy", validate(updatePharmacy), verifyAdminToken("pharmacy"), indexController.adminPharmacyController.updatePharmacy)
router.delete("/delete-pharmacy", validateQuery(getAndDeletePharmacyById), verifyAdminToken("superadmin"), indexController.adminPharmacyController.deletePharmacy)
router.get("/get-all-pharmacy", validateQuery(getAllPharmacy), verifyAdminToken("superadmin"), indexController.adminPharmacyController.getAllPharmacy);
router.get("/search-pharmacy", verifyAdminToken("superadmin"), indexController.adminPharmacyController.searchPharmacy);
router.post('/upload-pharmacy-licence', uploadLicenceImagePharmacy, verifyAdminToken("superadmin"), indexController.adminPharmacyController.uploadPharmacyDocument);

/** Super Admin Delivery Partner Routes */

router.put('/approve-delivery-partner', verifyAdminToken('superadmin'), indexController.adminDeliveryPartnerController.approveDeliveryPartner)
router.get('/get-all-delivery-partner',validateQuery(getAllDeliveryPartners) ,verifyAdminToken('superadmin'), indexController.adminDeliveryPartnerController.getAllDeliveryPartners);
router.get('/get-delivery-partner-by-id', validateQuery(getOrDeleteDeliveryPartner),verifyAdminToken('superadmin'), indexController.adminDeliveryPartnerController.getDeliveryPartnerById);
router.put('/update-delivery-partner', validate(updateDeliveryPartner),verifyAdminToken('superadmin'), indexController.adminDeliveryPartnerController.updateDeliveryPartner)
router.put('/update-availability-status', validate(updateDeliveryPartnerStatus),verifyAdminToken('superadmin'), indexController.adminDeliveryPartnerController.updateAvailabilityStatus);
router.delete('/delete-delivery-patner', validateQuery(getOrDeleteDeliveryPartner),verifyAdminToken('superadmin'), indexController.adminDeliveryPartnerController.deleteDeliveryPartner)
router.put('/block-unblock-delivery-partner',validate(blockUnblockDeliveryPartner) ,verifyAdminToken('superadmin'), indexController.adminDeliveryPartnerController.BlockUnblockDeliveryPartner)


/** Medicines Routes Superadmin */
router.post('/create-medicine', verifyAdminToken('superadmin'), indexController.medicineController.createMedicine)
router.put('/update-medicine', verifyAdminToken('superadmin'), indexController.medicineController.updateMedicine)
router.get('/get-all-medicines', verifyAdminToken('superadmin'), indexController.medicineController.getAllMedicines)
router.get('/get-medicine-by-id', verifyAdminToken('superadmin'), indexController.medicineController.getMedicineById)
router.get('/search-medicine', verifyAdminToken('superadmin'), indexController.medicineController.searchMedicine)
router.delete('/delete-medicine', verifyAdminToken('superadmin'), indexController.medicineController.deleteMedicine)
router.post('/upload-medicine-images', verifyAdminToken('superadmin'), uploadMedicineImages, indexController.medicineController.uploadMedicineImages)

//customer routes
router.get('/get-all-customer', validateQuery(getAllCustomersValidation),verifyAdminToken('superadmin'), indexController.adminCustomerController.getAllCustomers);
router.get('/get-customer-by-id', validateQuery(getCustomerByIdValidation),verifyAdminToken('superadmin'), indexController.adminCustomerController.getCustomerById);
router.put('/block-unblock-customer', validate(getCustomerByIdValidation),verifyAdminToken('superadmin'), indexController.adminCustomerController.BlockUnblockCustomer);


//** Special Offer Routes */

router.post("/create-special-offer", verifyAdminToken("superadmin"), indexController.adminSpecialOfferController.createSpecialOffer)
router.get("/get-special-offer-by-id", verifyAdminToken("superadmin"), indexController.adminSpecialOfferController.getSpecialOfferById)
router.get("/get-all-special-offer", verifyAdminToken("superadmin"), indexController.adminSpecialOfferController.getAllSpecialOffers)
router.put("/update-special-offer", verifyAdminToken("superadmin"), indexController.adminSpecialOfferController.updateSpecialOffer)
router.delete("/delete-special-offer", verifyAdminToken("superadmin"), indexController.adminSpecialOfferController.deleteSpecialOffer)
router.put("/update-special-offer-status", verifyAdminToken("superadmin"), indexController.adminSpecialOfferController.activeDeactiveSpecialOffer)

/** Best Selling Product */

router.post("/create-best-selling-product", verifyAdminToken("superadmin"), indexController.adminBestSellingController.createBestSellingProduct)
router.get("/get-all-best-selling-product", verifyAdminToken("superadmin"), indexController.adminBestSellingController.getAllBestSellingProduct);
router.put("/change-active-non-active-best-selling", verifyAdminToken("superadmin"), indexController.adminBestSellingController.updateStatus);
router.delete("/delete-best-selling-product", verifyAdminToken("superadmin"), indexController.adminBestSellingController.deleteBestSellingProduct);

//** Feature Product Routes */
router.post("/create-feature-product",validate(createFeature),verifyAdminToken("superadmin"),indexController.adminFeatureProductController.createFeaturedProduct);
router.get("/get-all-feature-product",validateQuery(getAllFeatures),verifyAdminToken("superadmin"),indexController.adminFeatureProductController.getAllFeaturedProducts);
router.delete("/delete-feature-product",validateQuery(getOrDeleteFeatureById),verifyAdminToken("superadmin"),indexController.adminFeatureProductController.deleteFeaturedProduct);
router.get("/get-feature-product-by-id",validateQuery(getOrDeleteFeatureById),verifyAdminToken("superadmin"),indexController.adminFeatureProductController.getFeatureProductById);
router.put("/update-feature-product-status",validate(updateFeatureStatus),verifyAdminToken("superadmin"),indexController.adminFeatureProductController.updateFeaturedProductStatus);

//Test Routes
router.post("/create-test",validate(createTestValidation),verifyAdminToken("superadmin"),indexController.adminTestController.createTest)
router.get("/get-all-test",validateQuery(getAllApiValidation),verifyAdminToken("superadmin"),indexController.adminTestController.getAllTests);
router.get("/get-test-by-id",validateQuery(getTestdeleteAndById),verifyAdminToken("superadmin"),indexController.adminTestController.getTestById);
router.delete("/delete-test",validateQuery(getTestdeleteAndById),verifyAdminToken("superadmin"),indexController.adminTestController.deleteTest);
router.get("/search-test",validateQuery(searchTestValidation),verifyAdminToken("superadmin"),indexController.adminTestController.searchTest);
router.put("/update-test",validate(updateTestValidation),verifyAdminToken("superadmin"),indexController.adminTestController.updateTest);

//Test Catg Routes
router.post("/create-test-Category",verifyAdminToken("superadmin"),indexController.adminTestCatgController.createTestCategory)
router.get("/get-all-test-Category",verifyAdminToken("superadmin"),indexController.adminTestCatgController.getAllTestCategories);
router.get("/get-test-Category-by-id",verifyAdminToken("superadmin"),indexController.adminTestCatgController.getTestCategoryById);
router.delete("/delete-test-Category",verifyAdminToken("superadmin"),indexController.adminTestCatgController.deleteTestCategoryById);
router.put("/update-test-Category",verifyAdminToken("superadmin"),indexController.adminTestCatgController.updateTestCategory);
router.post('/upload-test-category', verifyAdminToken('superadmin'), uploadTestCatgPic, indexController.adminTestCatgController.uploadTestCatgImg)


module.exports = router;
