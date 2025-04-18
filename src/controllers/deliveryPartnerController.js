const DeliveryPartner = require('../modals/delivery.model');
const { generateOTPNumber } = require('../services/helper');
const { successRes } = require('../services/response');
const { verifyOTPMail } = require('../services/sendMail');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const CustomError = require('../utils/customError');
const bcrypt = require('bcrypt');
const { assignJwt } = require('../utils/jsonWebToken');


module.exports.registerDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const {
        fullName,
        email,
        phone,
        password,
        profilePhoto,
        documents // expecting { aadharNumber, licenseNumber, idProof }
    } = req.body;

    if (!fullName || !phone || !password || !documents?.aadharNumber || !documents?.licenseNumber || !documents?.idProof) {
        return res.status(400).json({
            success: false,
            message: "Full name, phone, password, and all document fields are required.",
        });
    }

    const existingPartner = await DeliveryPartner.findOne({
        $or: [{ phone }, { email }],
    });

    if (existingPartner) {
        return next(new CustomError("Delivery partner already exists with this phone or email.", 400))
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTPNumber(4)

    const newPartner = new DeliveryPartner({
        fullname: fullName,
        email,
        phone,
        password: hashedPassword,
        profilePhoto,
        otp,
        documents: {
            aadharNumber: documents.aadharNumber,
            licenseNumber: documents.licenseNumber,
            idProof: documents.idProof,
        },
    });

    await newPartner.save();

    verifyOTPMail(email.toLowerCase(), fullName, otp)
    return successRes(res, 201, true, "Partner Registered Successfully", newPartner)
})

module.exports.verifyOtp = asyncErrorHandler(async (req, res, next) => {
    let { email, otp } = req.body;

    if (!email || !otp) {
        return next(new CustomError("Email and OTP are required", 400));
    }

    email = email.toLowerCase();

    const partner = await DeliveryPartner.findOne({ email });
    if (!partner) {
        return next(new CustomError("Email not found", 400));
    }

    if (partner.otp !== otp) {
        return next(new CustomError("Invalid OTP", 400));
    }

    partner.isVerified = true;
    partner.otp = null;
    await partner.save();

    return successRes(res, 200, true, "Verified successfully");
});

module.exports.loginDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    let { email, password } = req.body;
    if (!email || !password) {
        return next(new CustomError("Email and Password Required", 400));
    }
    email = email?.toLowerCase();
    let findPartner = await DeliveryPartner.findOne({ email });
    if (!findPartner) {
        return next(new CustomError("Invalid Email or Password", 400))
    }
    let comparePassword = await bcrypt.compare(password, findPartner.password)
    if (!comparePassword) {
        return next(new CustomError("Invalid Email or Password", 400))
    }
    if (!findPartner.isVerified) {
        return next(new CustomError("Please Verify you Email First", 400))
    }
    if (!findPartner.isApproved) {
        return next(new CustomError("Your Approval is Pending, Please wait!", 400))
    }
    const payload = {
        _id: findPartner._id,
        email: findPartner.email,
        role: findPartner.role,
        permissions: findPartner.permissions,
    };

    const token = assignJwt(payload);
    const sanitizedAdmin = findPartner.toObject();
    delete sanitizedAdmin.password;

    return successRes(res, 200, true, "Logged In Successfully", {
        ...sanitizedAdmin,
        token,
    });

})

module.exports.viewProfile = asyncErrorHandler(async (req, res, next) => {
    let partnerId = req.partner._id;
    let findPartner = await DeliveryPartner.findById(partnerId);
    if (!findPartner) {
        return next(new CustomError("Partner Not Found", 401));
    };
    let senitizeData = findPartner.toObject();
    delete senitizeData.password;
    return successRes(res, 200, true, "Partner Profile", senitizeData)

})

