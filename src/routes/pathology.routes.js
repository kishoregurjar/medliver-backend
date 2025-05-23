const express = require('express');
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require("../utils/jsonWebToken");
const {validate,validateQuery,TestListApiValidation,addTestToPathology} = require("../middleware/validation")

const router = express.Router();

router.get("/pathology", (req, res) => {
    res.send("Pathology route is working");
});

router.get('/get-notification-by-recipientId',verifyAdminToken("pathology"),indexController.commonController.getNotifications);
router.put('/update-notification-status',verifyAdminToken("pathology"),indexController.commonController.updateNotificationStatus);

// test routes
router.get('/search-test-pathology',verifyAdminToken('pathology'),indexController.pathologyController.searchTest);
router.get('/test-list',validateQuery(TestListApiValidation),verifyAdminToken('pathology'),indexController.pathologyController.testList);
router.post('/add-test-to-Stock',validate(addTestToPathology),verifyAdminToken('pathology'),indexController.pathologyController.addTestToStock)
router.get('/available-test-for-pathology',verifyAdminToken('pathology'),indexController.pathologyController.getAvailableTestsForPathology)
router.put('/update-test',verifyAdminToken('pathology'),indexController.pathologyController.updateTest);
router.delete('/remove-test-from-stock',verifyAdminToken('pathology'),indexController.pathologyController.removeTestFromStock);

module.exports = router;