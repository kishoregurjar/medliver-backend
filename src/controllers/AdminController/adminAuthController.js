const adminSchema = require('../../modals/admin.Schema');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const CustomError = require('../../utils/customError');
const { successRes } = require('../../services/response');
const asyncErrorHandler = require('../../utils/asyncErrorHandler');
const { assignJwt } = require("../../utils/jsonWebToken");
const { forgetPasswordMail } = require('../../services/sendMail');
const sendFirebaseNotification = require('../../services/sendNotification');
const pharmacyModel = require('../../modals/pharmacy.model');
const PathologyCenter = require('../../modals/pathology.model');
require('dotenv').config();

module.exports.login = asyncErrorHandler(async (req, res, next) => {
  let { email, password, deviceToken } = req.body;

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
  try {
    isMatch = await bcrypt.compare(password, findAdmin.password);
  } catch (error) {
    return next(new CustomError("Error comparing password", 500));
  }

  if (!isMatch) {
    return next(new CustomError("Invalid Email or Password", 404));
  }

  if (findAdmin.accountStatus === "blocked") {
    return next(new CustomError("Account is not active, Contact Administration", 400));
  }

  if (deviceToken) {
    findAdmin.deviceToken = deviceToken
    await findAdmin.save()
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

  let roleData = null;

  // Fetch role-specific data
  if (findAdmin.role === "pharmacy") {
    roleData = await pharmacyModel.findOne({ adminId: findAdmin._id }).lean();
  } else if (findAdmin.role === "pathology") {
    roleData = await PathologyCenter.findOne({ adminId: findAdmin._id }).lean();
  }

  return successRes(
    res,
    200,
    true,
    sanitizedAdmin.role === "superadmin"
      ? "Super Admin logged in successfully"
      : `${sanitizedAdmin.role} logged in successfully`,
    {
      ...sanitizedAdmin,
      token,
      roleData,
    }
  );
});

module.exports.getAdminDetails = asyncErrorHandler(async (req, res, next) => {
  const admin = req.admin._id;
  console.log("admin", admin);
  const findAdmin = await adminSchema.findById(admin).select("-password -__v -createdAt -updatedAt");
  if (!findAdmin) {
    return next(new CustomError("Admin not found", 404));
  }

  const sanitizedAdmin = findAdmin.toObject();
  delete sanitizedAdmin.password;
  return successRes(res, 200, true, "Details fetched successfully", sanitizedAdmin);
})

module.exports.forgetPassword = asyncErrorHandler(async (req, res, next) => {
  const { email } = req.body;
  const findAdmin = await adminSchema.findOne({ email });
  if (!findAdmin) {
    return next(new CustomError("Admin not found", 404));
  }
  console.log("findAdmin", findAdmin);
  const payload = {
    _id: findAdmin._id,
    email: findAdmin.email,
    role: findAdmin.role
  };

  const token = assignJwt(payload);

  const resetPasswordLink = `${process.env.FORGET_PASSWORD_LINK}/${token}`;

  const sendMail = forgetPasswordMail(
    email,
    findAdmin.name,
    resetPasswordLink
  );

  return successRes(res, 200, true, "Password reset link sent successfully", token);
})

module.exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  try {
    const { resetLink, password } = req.body;

    let decoded;
    try {
      decoded = jsonwebtoken.verify(resetLink, process.env.SECRET_KEY);
      console.log(decoded, "decoded token");
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return next(
          new CustomError("Reset link expired, please request a new one", 401)
        );
      }
      return next(new CustomError("Invalid token", 400));
    }

    const adminId = decoded._id;
    const findAdmin = await adminSchema.findById(adminId);
    if (!findAdmin) {
      return next(new CustomError("Admin not found", 404));
    }

    if (!password) {
      return next(new CustomError("Please provide a new password", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    findAdmin.password = hashedPassword;
    await findAdmin.save();

    return successRes(res, 200, true, "Password reset successfully");
  } catch (error) {
    return next(error);
  }
})

module.exports.changedPassword = asyncErrorHandler(async (req, res, next) => {
  const { newPassword, oldPassword } = req.body;
  const adminId = req.admin._id;
  const findAdmin = await adminSchema.findById(adminId);
  if (!findAdmin) {
    return next(new CustomError("Admin not found", 404));
  }

  if (!newPassword || !oldPassword) {
    return next(new CustomError("Please provide a new password", 400));
  }
  const isMatch = await bcrypt.compare(oldPassword, findAdmin.password);
  if (!isMatch) {
    return next(new CustomError("Old password is incorrect", 400));
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  findAdmin.password = hashedPassword;
  await findAdmin.save();
  return successRes(res, 200, true, "Password changed successfully");
});

module.exports.updateAdminProfile = asyncErrorHandler(async (req, res, next) => {

  const adminId = req.admin._id;
  const findAdmin = await adminSchema.findById(adminId);
  if (!findAdmin) {
    return next(new CustomError("Admin not found", 404));
  }
  const findRole = findAdmin.role
  if (req.body.email) {
    delete req.body.email;
  }
  const updateAdmin = await adminSchema.findByIdAndUpdate(adminId, req.body, {
    new: true,
    runValidators: true,
  });

  return successRes(res, 200, true, `${findRole} updated successfully`, updateAdmin);

});


module.exports.uploadAdminAvatar = asyncErrorHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError("No file uploaded.", 400));
  }

  const imageUrl = `${process.env.UPLOAD_ADMIN}${req.file.filename}`;
  return successRes(res, 200, true, "File Uploaded Successfully", { imageUrl });

});

module.exports.sendNotification = asyncErrorHandler(async (req, res, next) => {
  const { deviceToken, title, body } = req.body;

  if (!deviceToken || !title || !body) {
    return next(new CustomError("Device token, title and body are required", 400));
  }

  let message = await sendFirebaseNotification(deviceToken, title, body);

  if (!message.success) {
    return next(new CustomError("Failed to send notification", 500));
  }

  return successRes(res, 200, true, "Notification sent successfully");
});
