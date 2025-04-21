const customerModel = require("../modals/customer.model");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const CustomError = require("../utils/customError");
const { successRes } = require("../services/response");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const { assignJwt } = require("../utils/jsonWebToken");
const { forgetPasswordMail, verifyOTPMail } = require("../services/sendMail");
const { generateOTPNumber } = require("../services/helper");

module.exports.registerUser = asyncErrorHandler(async (req, res, next) => {
  const session = await customerModel.startSession();
  session.startTransaction();
  try {
    const { fullName, email, password, phoneNumber, userCoordinates } =
      req.body;

    if (!fullName || !email || !password || !phoneNumber) {
      await session.abortTransaction();
      session.endSession();
      return next(new CustomError("All fields are required", 400));
    }

    const findCustomer = await customerModel.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (findCustomer) {
      if (findCustomer.isVerified) {
        await session.abortTransaction();
        session.endSession();
        return successRes(
          res,
          200,
          true,
          "Customer already register",
          findCustomer
        );
      } else {
        await session.abortTransaction();
        session.endSession();
        return successRes(
          res,
          301,
          true,
          "Customer not verified",
          findCustomer
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let otp = generateOTPNumber(4);

    const customer = await customerModel.create(
      [
        {
          fullName,
          email,
          password: hashedPassword,
          userCoordinates,
          phoneNumber,
          otp,
        },
      ],
      { session }
    );

    const sanitizedUser = customer[0].toObject();
    delete sanitizedUser.password;

    const sendMail = verifyOTPMail(email, fullName, otp);
    // if (!sendMail) {
    //   await session.abortTransaction();
    //   session.endSession();
    //   return next(new CustomError("Error sending OTP", 500));
    // }

    await session.commitTransaction();
    session.endSession();

    return successRes(
      res,
      201,
      true,
      "Customer registered successfully",
      sanitizedUser
    );
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return next(new CustomError(error.message || "Something went wrong", 500));
  }
});

module.exports.verifyOtp = asyncErrorHandler(async (req, res, next) => {
  let { otp, email } = req.body;

  if (!otp || !email) {
    return next(new CustomError("OTP and email are required", 400));
  }

  const findUser = await customerModel.findOne({ email });
  if (!findUser) {
    return next(new CustomError("User not found", 404));
  }

  if (findUser.isVerified) {
    return next(new CustomError("User already verified", 400));
  }

  if (findUser.otp != otp) {
    return next(new CustomError("Invalid OTP", 400));
  }
  findUser.isVerified = true;
  findUser.otp = null;
  findUser.save({ validateBeforeSave: false });
  const sanitizedUser = findUser.toObject();
  delete sanitizedUser.password;
  delete sanitizedUser.otp;
  return successRes(
    res,
    200,
    true,
    "User verified successfully",
    sanitizedUser
  );
});

module.exports.loginUser = asyncErrorHandler(async (req, res, next) => {

  let { email, password } = req.body;
  if (!email || !password)
  {
    return next(new CustomError("Email and password are required", 400));
  }

  let findUser = await customerModel.findOne({ email });

  if (!findUser) {
    return next(new CustomError("Invalid Email or Password", 401));
  }

  let isMatch = await bcrypt.compare(password, findUser.password);
  if (!isMatch) {
    return next(new CustomError("Invalid Email or Password", 401));
  }

  return successRes(res, 200, true, "Login successfully", findUser);
});

module.exports.forgetPassword = asyncErrorHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new CustomError("Email is required", 400));
  }
  const findUser = await customerModel.findOne({ email });
  if (!findUser) {
    return next(new CustomError("User not found", 404));
  }
  let otp = generateOTPNumber(4);
  findUser.otp = otp;
  await findUser.save({ validateBeforeSave: false });
  const sendMail = await verifyOTPMail(email, findUser.fullName, otp);
  if (!sendMail) {
    return next(new CustomError("Error sending OTP", 500));
  }
  return successRes(res, 200, true, "OTP sent successfully", findUser);
});

module.exports.verifyForgetPasswordOtp = asyncErrorHandler(
  async (req, res, next) => {
    let { otp, email } = req.body;

    if (!otp || !email) {
      return next(new CustomError("OTP and email are required", 400));
    }

    const findUser = await customerModel.findOne({ email, isVerified: true });
    if (!findUser) {
      return next(new CustomError("User not found", 404));
    }

    if (findUser.otp != otp) {
      return next(new CustomError("Invalid OTP", 400));
    }
    findUser.otp = null;
    findUser.save({ validateBeforeSave: false });
    const sanitizedUser = findUser.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.otp;
    return successRes(
      res,
      200,
      true,
      "User verified successfully",
      sanitizedUser
    );
  }
);

module.exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new CustomError("Email and password are required", 400));
  }
  const findUser = await customerModel.findOne({ email, isVerified: true });
  if (!findUser) {
    return next(new CustomError("User not found", 404));
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  findUser.password = hashedPassword;
  await findUser.save();
  return successRes(res, 200, true, "Password reset successfully");
});




module.exports.getUserDetails = asyncErrorHandler(async (req, res, next)=>{
  const userId = req.user._id;
  const findUser = await customerModel.findById(userId).select("-password -otp").populate("previousOrders.orderId").populate("medicineReminders.medicineName").populate("userCoordinates");
  if (!findUser) {
    return next(new CustomError("User not found", 404));
  }
  return successRes(res, 200, true, "Details fetched successfully", findUser);
});