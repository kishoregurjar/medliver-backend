require('dotenv').config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../modals/admin.Schema"); 


const DB_URI = process.env.MONGODB_URI;

mongoose.connect(DB_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Connection Error:", err));

const seedAdmin = async () => {
    try {
        const existingAdmin = await Admin.findOne({ email: "superadmin@yopmail.com" });

        if (existingAdmin) {
            console.log("Admin already exists:", existingAdmin.email);
            mongoose.connection.close();
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash("Admin@123#", 12);  

        const admin = new Admin({
            name: "Super Admin",
            email: "superadmin@yopmail.com",
            password: hashedPassword, 
            role: "superadmin",  
            isActive: true, 
        });

        await admin.save();
        console.log("Super Admin user seeded successfully!");
    } catch (error) {
        console.error("Error seeding admin:", error);
    } finally {
        mongoose.connection.close();
    }
};

seedAdmin();
