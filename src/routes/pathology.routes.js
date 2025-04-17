const express = require('express');
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require("../utils/jsonWebToken");

const router = express.Router();

router.get("/pathology", (req, res) => {
    res.send("Pathology route is working");
});


module.exports = router;