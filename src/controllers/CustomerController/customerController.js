const customerModel = require("../../modals/customer.model");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const CustomError = require("../../utils/customError");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { assignJwt } = require("../../utils/jsonWebToken");
const { forgetPasswordMail, verifyOTPMail } = require("../../services/sendMail");
const { generateOTPNumber } = require("../../services/helper");
const FeaturedProduct = require("../../modals/featuredProduct.model");
const BestSellerModel = require("../../modals/bestSeller.model");
const specialOfferModel = require("../../modals/specialOffer.model");

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
  const findUser = await customerModel.findById(userId).select("-password -otp").populate("previousOrders.orderId").populate("medicineReminders.medicineName").populate("userCoordinates");
  if (!findUser) {
    return next(new CustomError("User not found", 404));
  }
  return successRes(res, 200, true, "Details fetched successfully", findUser);
});

module.exports.changeUserPassword = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { password } = req.body;
  if (!password) {
    return next(new CustomError("Password is required", 400));
  }
  const findUser = await customerModel.findById(userId);
  if (!findUser) {
    return next(new CustomError("User not found", 404));
  }
  const hashedPassword = await bcrypt.hash(password, 12);
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

// module.exports.getAllFeaturedProducts = asyncErrorHandler(async (req, res, next) => {
//   const featuredProducts = await featuredProductModel
//     .find({ isActive: true }) // only active featured products
//     .sort({ featuredAt: -1 }) 
//     .populate({
//       path: "product",
//       model: "Medicine",
//     });

//   return successRes(res, 200, true, "Featured products fetched successfully", featuredProducts);
// });
module.exports.getAllFeaturedProducts = asyncErrorHandler(async (req, res, next) => {
  let { page, limit, sortOrder } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const sortDir = sortOrder?.toLowerCase() === "asc" ? 1 : -1; // Default to descending order

  const [totalFeaturedProducts, featuredProducts] = await Promise.all([
    FeaturedProduct.countDocuments({ isActive: true }),
    FeaturedProduct.find({ isActive: true })
      .populate("product")
      .sort({ featuredAt: sortDir })
      .skip(skip)
      .limit(limit),
  ]);

  if (!featuredProducts || featuredProducts.length === 0) {
    return successRes(res, 200, false, "No featured products found", []);
  }

  return successRes(res, 200, true, "Featured products fetched successfully", {
    featuredProducts,
    totalFeaturedProducts,
    currentPage: page,
    totalPages: Math.ceil(totalFeaturedProducts / limit),
  });
});


module.exports.getAllSellingProduct = asyncErrorHandler(async (req, res, next) => {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const adminProducts = await BestSellerModel.find({
        isActive: true,
        isCreatedByAdmin: true
    })
        .populate('product')
        .sort({ soldCount: -1 })
        .skip(skip)
        .limit(limit);

    const remainingLimit = limit - adminProducts.length;

    let nonAdminProducts = [];

    if (remainingLimit > 0) {
        const excludedIds = adminProducts.map(item => item._id);

        nonAdminProducts = await BestSellerModel.find({
            isActive: true,
            isCreatedByAdmin: false,
            _id: { $nin: excludedIds }
        })
            .populate('product')
            .sort({ soldCount: -1 })
            .limit(remainingLimit);
    }

    const combinedResults = [...adminProducts, ...nonAdminProducts];

    const total = await BestSellerModel.countDocuments({
        isActive: true
    });

    return successRes(res, 200, true, "Best selling products fetched successfully", {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        products: combinedResults
    });
});

module.exports.getallSpecialOffers = asyncErrorHandler(
  async (req, res, next) => {
    let { page, limit, sortOrder } = req.query;
    
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const sortDir = sortOrder?.toLowerCase() === "asc" ? 1 : -1; 

    const [totalSpecialOffers, specialOffers] = await Promise.all([
      specialOfferModel.countDocuments(),
      specialOfferModel
        .find()
        .populate("product", "name image price")
        .sort({ createdAt: sortDir })  
        .skip(skip)
        .limit(limit),
    ]);

    if (!specialOffers || specialOffers.length === 0) {
      return successRes(res, 200, false, "No special offers found", []);
    }

    return successRes(res, 200, true, "Special offers fetched successfully", {
      specialOffers,
      totalSpecialOffers,
      currentPage: page,
      totalPages: Math.ceil(totalSpecialOffers / limit),
    });
  }
);



