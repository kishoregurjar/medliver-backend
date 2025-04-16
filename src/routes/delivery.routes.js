const express = require("express");
const indexController = require("../controllers/indexController");


const router = express.Router();

router.post("/register-delivery-partner", indexController.deliveryPartnerController.registerDeliveryPartner);

module.exports = router;