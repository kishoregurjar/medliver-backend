const express = require('express');

const router = express.Router();

router.get("/pathology", (req, res) => {
    res.send("Pathology route is working");
});

module.exports = router;