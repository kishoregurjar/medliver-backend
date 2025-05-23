const express = require('express');
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require("../utils/jsonWebToken");
const {validate,validateQuery,TestListApiValidation,addTestToPathology,updateTest,removeAndGetInfoTest} = require("../middleware/validation")

const router = express.Router();

router.get("/pathology", (req, res) => {
    res.send("Pathology route is working");
});

router.get('/get-notification-by-recipientId',verifyAdminToken("pathology"),indexController.commonController.getNotifications);
router.put('/update-notification-status',verifyAdminToken("pathology"),indexController.commonController.updateNotificationStatus);

// test routes
router.get('/search-test',verifyAdminToken('pathology'),indexController.pathologyTestController.searchTest);
router.get('/test-list',validateQuery(TestListApiValidation),verifyAdminToken('pathology'),indexController.pathologyTestController.testList);
router.post('/add-test-to-Stock',validate(addTestToPathology),verifyAdminToken('pathology'),indexController.pathologyTestController.addTestToStock)
router.get('/available-test-for-pathology',verifyAdminToken('pathology'),indexController.pathologyTestController.getAvailableTestsForPathology)
router.put('/update-test',validate(updateTest),verifyAdminToken('pathology'),indexController.pathologyTestController.updateTest);
router.delete('/remove-test-from-stock',validateQuery(removeAndGetInfoTest),verifyAdminToken('pathology'),indexController.pathologyTestController.removeTestFromStock);
router.get('/get-single-test-detail',validateQuery(removeAndGetInfoTest),verifyAdminToken('pathology'),indexController.pathologyTestController.getSingleTestInfo);
router.get('/search-test-in-pathology',verifyAdminToken('pathology'),indexController.pathologyTestController.searchTestInMyStock);
router.put('/change-test-status',validate(removeAndGetInfoTest),verifyAdminToken('pathology'),indexController.pathologyTestController.changeTestStatus);

// pathology COntroller Route
router.get('/get-my-pathology-center',verifyAdminToken('pathology'),indexController.pathologyController.getMyPathologyCenter)

module.exports = router;