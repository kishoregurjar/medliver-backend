const adminController = require('./adminController');
const pharmacyController = require('./pharmacyController');
const deliveryPartnerController = require('./deliveryPartnerController')
const stockController = require("../controllers/stockController")

module.exports = {
    adminController,
    pharmacyController,
    deliveryPartnerController,
    stockController
}