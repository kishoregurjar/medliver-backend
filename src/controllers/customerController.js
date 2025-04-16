const customerModel = require("../modals/customer.model");
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const CustomError = require('../utils/customError');
const {successRes} = require('../services/response');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const { assignJwt } = require("../utils/jsonWebToken");
const { forgetPasswordMail } = require('../services/sendMail');




module.exports.register = asyncErrorHandler(async (req, res, next)=>{
    const {fullName,email,password,phoneNumber} = req.body;

    if(!fullName || !email || !password || !phoneNumber){
        return next(new CustomError("All fields are required",400));
    }

    const findCustomer = await customerModel.find({email,phoneNumber});
    if(findCustomer.length > 0){
        return next(new CustomError("Customer already exists",400));
    }
    const hashedPassword = await bcrypt.hash(password,12);
    const customer = await customerModel.create({
        fullName,
        email,
        password: hashedPassword,
        phoneNumber
    })
    await customer.save();
    const sanitizedUser = customer.toObject();
    delete sanitizedUser.password;
    return successRes(res,200,true,"Customer registered successfully",sanitizedUser);
})