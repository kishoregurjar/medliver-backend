const doctorSchema = require("../../modals/doctorSchema");
const { generateOTPNumber } = require("../../services/helper");
const { successRes } = require("../../services/response");
const { forgetPasswordMail, forgetPasswordMailDeliverypartner } = require("../../services/sendMail");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const { assignJwt } = require("../../utils/jsonWebToken");
const bcrypt = require("bcrypt");


module.exports.loginDoctor = asyncErrorHandler(async (req, res, next) => {
    let { email, password } = req.body;

    if (!email || !password) {
        return next(new CustomError("Email and Password are required", 400));
    }

    const findDoctor = await doctorSchema.findOne({ email });

    if (!findDoctor) {
        return next(new CustomError("Invalid Email or Password", 404));
    }
    let comparePassword = await bcrypt.compare(password, findDoctor.password);
    if (!comparePassword) {
        return next(new CustomError("Invalid Email or Password", 404));
    }

    const payload = {
        _id: findDoctor._id,
        email: findDoctor.email,
        role: findDoctor.role,
    };

    const token = assignJwt(payload);
    console.log(token, "token")
    return successRes(res, 200, true, "Login successful", { findDoctor, token });
});

module.exports.viewProfile = asyncErrorHandler(async (req, res, next) => {
    let doctorId = req.doctor._id
    let doctor = await doctorSchema.findById(doctorId);
    if (!doctor) {
        return next(new CustomError("Doctor Not Found", 404))
    }
    return successRes(res, 200, true, "Doctor's Profile", doctor)
})

module.exports.changePassword = asyncErrorHandler(async (req, res, next) => {
    const doctorId = req.doctor._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return next(new CustomError("Old password and new password are required", 400));
    }

    const doctor = await doctorSchema.findById(doctorId);
    if (!doctor) {
        return next(new CustomError("Doctor not found", 404));
    }

    const comparePassword = await bcrypt.compare(oldPassword, doctor.password);
    if (!comparePassword) {
        return next(new CustomError("Invalid old password", 404));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    doctor.password = hashedPassword;
    await doctor.save();

    return successRes(res, 200, true, "Password changed successfully");
});

module.exports.forgetPassword = asyncErrorHandler(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new CustomError("Email is required", 400))
    }
    const findDoctor = await doctorSchema.findOne({ email });
    if (!findDoctor) {
        return next(new CustomError("Doctor not found", 404));
    }
    findDoctor.otp = generateOTPNumber(4)
    await findDoctor.save();
    let sendMail = forgetPasswordMailDeliverypartner(findDoctor.email, findDoctor.first_name, findDoctor.otp);
    return successRes(res, 200, true, "OTP sent successfully", null);
})

module.exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return next(new CustomError("Email, OTP & Password are required", 400));
    }
    const findDoctor = await doctorSchema.findOne({ email });
    if (!findDoctor) {
        return next(new CustomError("Doctor not found", 404));
    }
    if (findDoctor.otp != otp) {
        return next(new CustomError("Incorrect OTP", 400));
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    findDoctor.password = hashedPassword;
    findDoctor.otp = null;
    await findDoctor.save();
    return successRes(res, 200, true, "Password reset successfully");
})