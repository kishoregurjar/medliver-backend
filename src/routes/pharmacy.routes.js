const express = require('express');

const router = express.Router();

router.get("/pharmacy", (req, res) => {
    res.send("pharmacy route is working");
});

module.exports = router;