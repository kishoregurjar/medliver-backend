const adminController = require('./adminController');
const pharmacyController = require('./pharmacyController');const customerController = require('./customerController');
const deliveryPartnerController = require('./deliveryPartnerController')
const stockController = require("../controllers/stockController")
const pathologyController = require('../controllers/pathologyController');

module.exports = {
    adminController,
    pharmacyController,
    deliveryPartnerController,
    stockController
}