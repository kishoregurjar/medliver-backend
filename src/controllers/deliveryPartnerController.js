const DeliveryPartner = require('../modals/delivery.model');
const { successRes } = require('../services/response');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const CustomError = require('../utils/customError');
const bcrypt = require('bcrypt')


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

    const newPartner = new DeliveryPartner({
        fullname: fullName,
        email,
        phone,
        password: hashedPassword,
        profilePhoto,
        documents: {
            aadharNumber: documents.aadharNumber,
            licenseNumber: documents.licenseNumber,
            idProof: documents.idProof,
        },
    });

    await newPartner.save();
    return successRes(res, 201, true, "Partner Registered Successfully", newPartner)
})