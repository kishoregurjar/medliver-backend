const express = require("express");
const indexController = require("../controllers/indexController");

const router = express.Router();


router.post("/register-user", indexController.customerController.register);


module.exports = router;