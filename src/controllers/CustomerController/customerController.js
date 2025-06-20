const customerModel = require("../../modals/customer.model");
const bcrypt = require("bcrypt");
const CustomError = require("../../utils/customError");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { assignJwt } = require("../../utils/jsonWebToken");
const { verifyOTPMail } = require("../../services/sendMail");
const { generateOTPNumber } = require("../../services/helper");
const CustomerAddress = require('../../modals/customerAddress.model'); // Adjust path as needed



module.exports.registerUser = asyncErrorHandler(async (req, res, next) => {
  const session = await customerModel.startSession();
  session.startTransaction();
  try {
    const { fullName, email, password, phoneNumber, userCoordinates, agree } =
      req.body;

    if (!agree) {
      await session.abortTransaction();
      session.endSession();
      return next(new CustomError("You must agree to the terms and conditions", 400));
    }

    if (!fullName || !email || !password || !phoneNumber) {
      await session.abortTransaction();
      session.endSession();
      return next(new CustomError("All fields are required", 400));
    }

    const existingEmail = await customerModel.findOne({ email });
    if (existingEmail) {
      await session.abortTransaction();
      session.endSession();
      return next(new CustomError("Email is already registered", 400));
    }

    const existingPhone = await customerModel.findOne({ phoneNumber });
    if (existingPhone) {
      await session.abortTransaction();
      session.endSession();
      return next(new CustomError("Phone number is already registered", 400));
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

  const payload = {
    _id: findUser._id,
    email: findUser.email,
  }

  const token = await assignJwt(payload);
  const sanitizedUser = findUser.toObject();
  delete sanitizedUser.password;
  delete sanitizedUser.otp;
  sanitizedUser.token = token;
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
  if (!email || !password) {
    return next(new CustomError("Email and password are required", 400));
  }

  let findUser = await customerModel.findOne({ email });

  if (!findUser) {
    return next(new CustomError("Invalid Email or Password", 401));
  }

  if (findUser.isVerified == false) {
    return next(new CustomError("User not verified", 301));
  }

  if (findUser.isBlocked == true) {
    return next(new CustomError("User is blocked", 400));
  }

  let isMatch = await bcrypt.compare(password, findUser.password);
  if (!isMatch) {
    return next(new CustomError("Invalid Email or Password", 401));
  }

  const payload = {
    _id: findUser._id,
    email: findUser.email,
  }

  const token = await assignJwt(payload);
  findUser = findUser.toObject();
  delete findUser.password;
  findUser.token = token;

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
  if (findUser.isVerified == false) {
    return next(new CustomError("User not verified", 301));
  }
  if (findUser.isBlocked == true) {
    return next(new CustomError("User is blocked", 400));
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

module.exports.getUserDetails = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const findUser = await customerModel.findById(userId).select("-password -otp");
  if (!findUser) {
    return next(new CustomError("User not found", 404));
  }
  return successRes(res, 200, true, "Details fetched successfully", findUser);
});

module.exports.changeUserPassword = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { newPassword, oldPassword } = req.body;
  if (!newPassword || !oldPassword) {
    return next(new CustomError("Password is required", 400));
  }
  const findUser = await customerModel.findById(userId);
  if (!findUser) {
    return next(new CustomError("User not found", 404));
  }

  const isMatch = await bcrypt.compare(oldPassword, findUser.password);
  if (!isMatch) {
    return next(new CustomError("Old password is incorrect", 400));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  findUser.password = hashedPassword;
  await findUser.save();
  const sanitizedUser = findUser.toObject();
  delete sanitizedUser.password;
  delete sanitizedUser.otp;
  return successRes(res, 200, true, "Password changed successfully", sanitizedUser);
});

module.exports.updateUserProfile = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const findUser = await customerModel.findById(userId);
  if (!findUser) {
    return next(new CustomError("User not found", 404));
  }
  const updateUser = await customerModel.findByIdAndUpdate(userId, req.body, { new: true });
  if (!updateUser) {
    return next(new CustomError("User not found", 404));
  }
  const sanitizedUser = updateUser.toObject();
  delete sanitizedUser.password;
  delete sanitizedUser.otp;
  return successRes(res, 200, true, "Profile updated successfully", sanitizedUser);
})

module.exports.updateUserProfilePicture = asyncErrorHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError("No File Uploaded", 400))
  }

  const filePath = `${process.env.USER_PROFILE_PIC}${req.file.filename}`;

  return successRes(res, 200, true, "Licence Uploaded Successfully", filePath);
});

module.exports.signUPSignInWithGoogle = asyncErrorHandler(async (req, res, next) => {
  const { email, fullName, profilePicture } = req.body;

  try {
    let user = await Customer.findOne({ email });

    if (!user) {

      user = await Customer.create({
        fullName,
        email,
        profilePicture,
        password: null,
        phoneNumber: null,
        isVerified: true,
        loginType: 'google',
      });
    }

    const payload = {
      _id: user._id,
      email: user.email,
    };
    const token = await assignJwt(payload);
    user = user.toObject();
    delete user.password;
    user.token = token;
    user.isVerified = true;

    return successRes(res, 200, true, "Login successful", {
      user,
      token
    });
  } catch (err) {
    return next(new CustomError("Something went wrong", 500));
  }
});

/** Address Portion */

module.exports.addAddress = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  let {
    address_type,
    house_number,
    street,
    landmark,
    city,
    state,
    pincode,
    country,
    location,
    is_default
  } = req.body;

  if (!city || !state || !pincode) {
    return next(new CustomError("City, state, and pincode are required", 400));
  }

  const addressCount = await CustomerAddress.countDocuments({ customer_id: userId });

  if (addressCount === 0) {
    is_default = true;
  }

  if (is_default && addressCount > 0) {
    await CustomerAddress.updateMany(
      { customer_id: userId, is_default: true },
      { $set: { is_default: false } }
    );
  }

  const newAddress = new CustomerAddress({
    customer_id: userId,
    address_type,
    house_number,
    street,
    landmark,
    city,
    state,
    pincode,
    country,
    location,
    is_default
  });

  await newAddress.save();

  return successRes(res, 201, true, "Address added successfully", newAddress);
});

module.exports.getAllAddress = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const addresses = await CustomerAddress.find({ customer_id: userId });
  if (!addresses) {
    return successRes(res, 200, true, "No addresses found", []);
  }
  return successRes(res, 200, true, "Addresses fetched successfully", addresses);
});

module.exports.editAddress = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const addressId = req.body.addressId;

  const {
    address_type,
    house_number,
    street,
    landmark,
    city,
    state,
    pincode,
    country,
    location,
  } = req.body;

  if (!city || !state || !pincode) {
    return next(new CustomError("City, state, and pincode are required", 400));
  }

  const address = await CustomerAddress.findOne({ _id: addressId, customer_id: userId });

  if (!address) {
    return next(new CustomError("Address not found", 404));
  }

  address.address_type = address_type || address.address_type;
  address.house_number = house_number || address.house_number;
  address.street = street || address.street;
  address.landmark = landmark || address.landmark;
  address.city = city;
  address.state = state;
  address.pincode = pincode;
  address.country = country || address.country;
  address.location = location || address.location;

  await address.save();

  return successRes(res, 200, true, "Address updated successfully", address);
});

module.exports.deleteAddress = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const addressId = req.query.addressId;
  const newDefaultAddressId = req.query.defaultAddressId;
  if (!addressId) {
    return next(new CustomError("Address ID is required", 400));
  }

  const userAddresses = await CustomerAddress.find({ customer_id: userId });

  if (userAddresses.length <= 1) {
    return next(new CustomError("At least one address must be available. Cannot delete the only address.", 400));
  }

  const addressToDelete = await CustomerAddress.findOne({ _id: addressId, customer_id: userId });

  if (!addressToDelete) {
    return next(new CustomError("Address not found", 404));
  }

  if (addressToDelete.is_default) {
    if (!newDefaultAddressId) {
      return next(new CustomError("New default address ID is required before deleting the current default address", 400));
    }

    const newDefault = await CustomerAddress.findOne({
      _id: newDefaultAddressId,
      customer_id: userId,
    });

    if (!newDefault) {
      return next(new CustomError("New default address not found or does not belong to user", 404));
    }

    newDefault.is_default = true;
    await newDefault.save();
  }

  await CustomerAddress.findByIdAndDelete(addressId);

  return successRes(res, 200, true, "Address deleted successfully", addressToDelete);
});

module.exports.getAddressById = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const addressId = req.query.addressId;
  if (!addressId) {
    return next(new CustomError("Address ID is required", 400));
  }
  const address = await CustomerAddress.findOne({ _id: addressId, customer_id: userId });
  if (!address) {
    return next(new CustomError("Address not found", 404));
  } else {
    return successRes(res, 200, true, "Address fetched successfully", address);
  }
})

module.exports.setDefaultAddress = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const addressId = req.body.addressId;
  if (!addressId) {
    return next(new CustomError("Address ID is required", 400));
  }

  const address = await CustomerAddress.findOne({ _id: addressId, customer_id: userId });
  if (!address) {
    return next(new CustomError("Address not found", 404));
  }
  if (address.is_default) {
    return next(new CustomError("Address is already set as default", 400));
  }
  await CustomerAddress.updateMany({ customer_id: userId }, { $set: { is_default: false } });
  address.is_default = true;
  await address.save();

  return successRes(res, 200, true, "Address set as default successfully", address);
});


