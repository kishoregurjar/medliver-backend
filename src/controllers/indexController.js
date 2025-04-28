const adminAuthController = require('./AdminController/adminAuthController');
const pharmacyController = require('./PharmacyOwnerController/pharmacyController');
const customerController = require('./CustomerController/customerController');
const deliveryPartnerController = require('./DeliveryPartnerController/deliveryPartnerController')
const stockController = require("../controllers/stockController")
const adminPathologyController = require('../controllers/AdminController/adminPathologyController');
const medicineController = require("./MedicineController/medicineController")
const adminCustomerController = require('./AdminController/adminCustomerController');
const adminDeliveryPartnerController = require('./AdminController/adminDeliverypartnerController');
const adminPharmacyController = require('./AdminController/adminPharmacyController');
const adminSpecialOfferController = require('./AdminController/adminSpecialOfferController');
const adminFeatureProductController = require("./AdminController/adminFeatureProductController");
const adminBestSellingController = require('./AdminController/adminBestSellingProdudct');
const adminTestController = require("./AdminController/adminTestController");
const customerCartController = require('./CustomerController/customerCartController');
const adminTestCatgController = require("./AdminController/adminTestCatgController");
const customerSpecialProductController = require('./CustomerController/customerSpecialProductController')
const adminInsuranceController = require("./AdminController/adminInsuranceController");
const adminVehicleController = require("./AdminController/adminVehicleController");
const customerMissLiniesController  = require("./CustomerController/cutomermiscellaneous");
const adminDoctoreCategoryController = require("./AdminController/adminDoctoresCatgController");
const customerOrderController = require("./CustomerController/customerOrderController")

module.exports = {
    adminAuthController,
    pharmacyController,
    deliveryPartnerController,
    stockController,
    customerController,
    adminPathologyController,
    medicineController,
    adminCustomerController,
    adminDeliveryPartnerController,
    adminPharmacyController,
    adminSpecialOfferController,
    adminFeatureProductController,
    adminBestSellingController,
    customerCartController,
    adminTestController,
    adminTestCatgController,
    customerSpecialProductController,
    adminInsuranceController,
    adminVehicleController,
    customerMissLiniesController,
    adminDoctoreCategoryController,
    customerOrderController,

}