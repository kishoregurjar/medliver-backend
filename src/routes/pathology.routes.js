const express = require('express');
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require("../utils/jsonWebToken");

const router = express.Router();

router.get("/pathology", (req, res) => {
    res.send("Pathology route is working");
});
router.get('/get-notification-by-recipientId',verifyAdminToken("pathology"),indexController.commonController.getNotifications);
router.put('/update-notification-status',verifyAdminToken("pathology"),indexController.commonController.updateNotificationStatus);



module.exports = router;