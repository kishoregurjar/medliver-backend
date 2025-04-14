const express = require("express");
const indexController = require("../controllers/indexController");
const router = express.Router();

router.post("/admin-login",indexController.adminController.login);


module.exports = router;