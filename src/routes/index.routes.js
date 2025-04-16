const express = require('express');
const router = express.Router();

router.use('/admin', require('./admin.routes'));
router.use('/user', require('./user.routes'));
router.use("/delivery", require("./delivery.routes"));
router.use("/pharmacy", require("./pharmacy.routes"));
router.use("/pathology", require("./pathology.routes"));

module.exports = router;