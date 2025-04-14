const adminSchema = require('../modals/admin.Schema');
const bcrypt = require('bcrypt');
// const jsonwebtoken = require('jsonwebtoken');
const CustomError = require('../utils/customError');
const {successRes} = require('../services/response');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
// const { assignJwt } = require('../utils/jwtToken');
const { assignJwt } = require("../utils/jsonWebToken");

module.exports.login = asyncErrorHandler(async (req, res, next) => {
    let { email, password } = req.body;

    if (!email || !password) {
        return next(new CustomError("Email and password are required", 400));
    }

    const findAdmin = await adminSchema.findOne({ email });

    if (!findAdmin) {
        return next(new CustomError("Invalid Email or Password", 404));
    }

    if (!findAdmin.password) {
        return next(new CustomError("Password not found for this account", 404));
    }

    let isMatch;
    console.log("findAdmin.password", findAdmin.password);
    try {
        isMatch = await bcrypt.compare(password, findAdmin.password); // Hash comparison
    } catch (error) {
        return next(new CustomError("Error comparing password", 500));
    }

    if (!isMatch) {
        return next(new CustomError("Invalid Email or Password", 404));
    }

    if (findAdmin.accountStatus === "blocked") {
        return next(new CustomError("Account is not active, Contact Administration", 400));
    }

   
    const payload = {
        _id: findAdmin._id,
        email: findAdmin.email,
        role: findAdmin.role,
        permissions: findAdmin.permissions,
    };

    
    const token = assignJwt(payload);

   
    const sanitizedAdmin = findAdmin.toObject();
    delete sanitizedAdmin.password;

    return successRes(res, 200, true, sanitizedAdmin.role === "superadmin" ? "Super Admin logged in successfully" : `${sanitizedAdmin.role} logged in successfully`, {
        ...sanitizedAdmin,
        token,
    });
});
