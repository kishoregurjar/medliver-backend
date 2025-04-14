const express = require("express");

const router = express.Router();

router.get("/delivery", (req, res) => {
  res.send("Delivery route is working!");
});

module.exports = router;