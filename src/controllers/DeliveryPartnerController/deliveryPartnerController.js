const DeliveryPartner = require('../../modals/delivery.model');
const { generateOTPNumber } = require('../../services/helper');
const { successRes } = require('../../services/response');
const { verifyOTPMail, forgetPasswordMail, forgetPasswordMailDeliverypartner } = require('../../services/sendMail');
const asyncErrorHandler = require('../../utils/asyncErrorHandler');
const CustomError = require('../../utils/customError');
const bcrypt = require('bcrypt');
const { assignJwt } = require('../../utils/jsonWebToken');


module.exports.registerDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const {
        fullName,
        email,
        phone,
        password,
        profilePhoto,
        documents // expecting { aadharNumber, licenseNumber, idProof }
    } = req.body;

    if (!fullName || !phone || !password || !documents?.aadharUrls || !documents?.licenseUrl || !documents?.idProof) {
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
            aadharUrls: documents.aadharUrls,
            licenseUrl: documents.licenseUrl,
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
    if (!findPartner.approvalStatus === "pending") {
        return next(new CustomError("Your Approval is Pending, Please wait!", 400))
    }
    if (findPartner.approvalStatus === "rejected") {
        return next(new CustomError("Your Account is Rejected, Please wait!", 400))
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

module.exports.editDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const partnerId = req.partner._id;
    const { fullName, phone, email, profilePhoto } = req.body;

    const findPartner = await DeliveryPartner.findById(partnerId);
    if (!findPartner) {
        return next(new CustomError("Delivery Partner not found", 404));
    }

    // Update fields if provided
    if (fullName) findPartner.fullname = fullName;
    if (phone) findPartner.phone = phone;
    if (email) findPartner.email = email.toLowerCase();
    if (profilePhoto) findPartner.profilePhoto = profilePhoto;

    await findPartner.save();

    return successRes(res, 200, true, "Delivery Partner updated successfully");
});

module.exports.changePassword = asyncErrorHandler(async (req, res, next) => {
    const partnerId = req.partner._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return next(new CustomError("Old password and new password are required", 400));
    }

    const partner = await DeliveryPartner.findById(partnerId);
    if (!partner) {
        return next(new CustomError("Delivery Partner not found", 404));
    }

    const isMatch = await bcrypt.compare(oldPassword, partner.password);
    if (!isMatch) {
        return next(new CustomError("Old password is incorrect", 401));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    partner.password = hashedPassword;
    await partner.save();

    return successRes(res, 200, true, "Password changed successfully");
});

module.exports.forgetPassword = asyncErrorHandler(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new CustomError("Email is required", 400))
    }
    let emailLowerCase = email.toLowerCase();
    const findPartner = await DeliveryPartner.findOne({ email:emailLowerCase });
    if (!findPartner) {
        return next(new CustomError("Partner not found", 404));
    }

    let otp = generateOTPNumber(4);

    forgetPasswordMailDeliverypartner(
        email,
        findPartner.fullname,
        otp
    );

    findPartner.otp = otp;
    await findPartner.save()

    return successRes(res, 200, true, "Otp sent successfully", otp);
})

module.exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    let { email, otp, newPassword } = req.body;

    // Basic validation
    if (!email?.trim() || !otp?.trim() || !newPassword?.trim()) {
        return next(new CustomError("Email, OTP & Password are required", 400));
    }

    email = email.trim().toLowerCase(); // normalize email
    otp = otp.trim();
    newPassword = newPassword.trim();

    const partner = await DeliveryPartner.findOne({ email });

    if (!partner) {
        return next(new CustomError("Partner not found", 404));
    }

    if (partner.otp != otp) {
        return next(new CustomError("Incorrect OTP", 400));
    }

    partner.password = await bcrypt.hash(newPassword, 10);
    partner.otp = null;
    await partner.save();

    return successRes(res, 200, true, "Password reset successfully");
});

module.exports.uploadDeliveryProfile = asyncErrorHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new CustomError("No File Uploaded", 400))
    }

    const filePath = `${process.env.DELIVERY_PARTNER_PROFILE_PIC}${req.file.filename}`;

    return successRes(res, 200, true, "Image Uploaded Successfully", filePath);
})

module.exports.uploadDeliveryAdharCardImages = asyncErrorHandler(async (req, res, next) => {
    if (!req.files) {
        return next(new CustomError("No File Uploaded", 400))
    }
    const frontPic = `${process.env.DELIVERY_PARTNER_ADHARCARD}${req.files[1].filename}`
    const backPic = `${process.env.DELIVERY_PARTNER_ADHARCARD}${req.files[0].filename}`

    return successRes(res, 200, true, "Image Uploaded Successfully", {
        frontPic, backPic
    });
})

module.exports.uploadLicence = asyncErrorHandler(async (req, res, next) => {
    if (!req.file) {
        return next(new CustomError("No File Uploaded", 400))
    }

    const filePath = `${process.env.DELIVERY_PARTNER_LICENCE}${req.file.filename}`;

    return successRes(res, 200, true, "Licence Uploaded Successfully", filePath);
})

module.exports.updateDeliveryPartnerStatus = asyncErrorHandler(async (req, res, next) => {
    const { status } = req.body;
    const partnerId = req.partner?._id;

    const validStatuses = ["available", "on-delivery", "offline"];
    if (!validStatuses.includes(status)) {
        return next(new CustomError("Invalid status provided", 400));
    }

    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
        partnerId,
        { availabilityStatus: status },
        { new: true }
    );

    if (!updatedPartner) {
        return next(new CustomError("Failed to update status", 500));
    }

    return successRes(res, 200, true, "Status updated successfully", updatedPartner);
});


module.exports.verifyForgotPasswordOtp = asyncErrorHandler(async  (req,res,next) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return next(new CustomError("Email and OTP are required", 400));
    }

    emailLowercase = email.toLowerCase();

    const partner = await DeliveryPartner.findOne({ email:emailLowercase });
    if (!partner) {
        return next(new CustomError("Email not found", 400));
    }

    if (partner.otp !== otp) {
        return next(new CustomError("Invalid OTP", 400));
    }
    await partner.save();
    return successRes(res, 200, true, "Verified successfully");
})