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
    adminFeatureProductController
}