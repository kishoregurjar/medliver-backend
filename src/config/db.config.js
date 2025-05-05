const mongoose = require("mongoose");
exports.connect = () => {
    mongoose
        .connect(process.env.MONGODB_URI)
        .then(() => {
            console.log("Successfully connected to MongoDB.");
        })
        .catch((e) => {
            console.error("Connection error", e.message);
        });
};