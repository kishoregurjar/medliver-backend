const express = require('express');
const indexController = require("../controllers/indexController");
const { verifyAdminToken } = require("../utils/jsonWebToken");

const router = express.Router();

router.get("/pathology", (req, res) => {
    res.send("Pathology route is working");
});

router.post("/create-pathology",verifyAdminToken("superadmin"),indexController.pathologyController.createPathologyCenter)
router.get("/get-pathology-by-id",verifyAdminToken("superadmin"),indexController.pathologyController.getPathologyCenterById)
router.get("/get-all-pathology",verifyAdminToken("superadmin"),indexController.pathologyController.getAllPathologyCenters)
router.put("/update-pathology",verifyAdminToken("superadmin"),indexController.pathologyController.updatePathologyCenter)
router.delete("/delete-pathology",verifyAdminToken("superadmin"),indexController.pathologyController.deletePathologyCenter)


module.exports = router;