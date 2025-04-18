const adminController = require('./adminController');
const pharmacyController = require('./pharmacyController'); const customerController = require('./customerController');
const deliveryPartnerController = require('./deliveryPartnerController')
const stockController = require("../controllers/stockController")
const pathologyController = require('../controllers/pathologyController');
const medicineController = require("../controllers/medicineController")

module.exports = {
    adminController,
    pharmacyController,
    deliveryPartnerController,
    stockController,
    customerController,
    pathologyController,
    medicineController
}