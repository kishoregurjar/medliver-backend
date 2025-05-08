const PathologyCenter = require('../../modals/pathology.model')
const Admin = require('../../modals/admin.Schema')
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const asyncErrorHandler = require("../../utils/asyncErrorHandler")
const CustomError = require('../../utils/customError')
const { successRes } = require('../../services/response');

module.exports.createPathologyCenter = asyncErrorHandler(async (req, res, next) => {
  const admin = req.admin;
  const {
    centerName,
    email,
    phoneNumber,
    address,
    password,
  } = req.body;

  if (!admin.role || admin.role !== "superadmin") {
    return next(new CustomError("Only superadmin can create a pathology center", 403));
  }

  if (!centerName || !email || !phoneNumber || !address || !password) {
    return next(new CustomError("All required fields must be provided", 400));
  }

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    // Sequentially check for existing email or phone
    const existingCenter = await PathologyCenter.findOne({
      $or: [{ email }, { phoneNumber }]
    }).session(session);

    const existingAdmin = await Admin.findOne({ email }).session(session);

    if (existingCenter || existingAdmin) {
      throw new CustomError("Email or phone already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new admin
    const newAdmin = new Admin({
      name: centerName,
      email,
      password: hashedPassword,
      role: "pathology",
      avatar: null,
      isActive: true,
    });

    await newAdmin.save({ session });

    // Create new pathology center
    const newCenter = new PathologyCenter({
      centerName,
      email,
      phoneNumber,
      address,
      adminId: newAdmin._id,
    });

    await newCenter.save({ session });

    // Link pathology center to admin
    newAdmin.pathologyCenterId = newCenter._id;
    await newAdmin.save({ session });

    await session.commitTransaction();

    const sanitizedAdmin = newAdmin.toObject();
    delete sanitizedAdmin.password;

    return successRes(res, 201, true, "Pathology Center and Admin created successfully", {
      admin: sanitizedAdmin,
      pathologyCenter: newCenter,
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});



module.exports.getPathologyCenterById = asyncErrorHandler(async (req, res, next) => {
  const { pathologyCenterId } = req.query;

  if (!pathologyCenterId) {
    return next(new CustomError('Please provide pathologyCenterId', 404));
  }

  const pathologyCenter = await PathologyCenter.findById(pathologyCenterId).populate('adminId');

  if (!pathologyCenter) {
    return next(new CustomError('Pathology Center not found', 404));
  }

  const pathologyCenterData = pathologyCenter.toObject();

  if (pathologyCenterData.adminId && pathologyCenterData.adminId.password) {
    delete pathologyCenterData.adminId.password;
  }

  return successRes(res, 200, true, 'Pathology Center fetched successfully.', {
    pathologyCenter: pathologyCenterData,
  });
});

module.exports.deletePathologyCenter = asyncErrorHandler(async (req, res, next) => {
  const { pathologyCenterId } = req.query;

  const pathologyCenter = await PathologyCenter.findById(pathologyCenterId);

  if (!pathologyCenter) {
    return next(new CustomError('Pathology Center not found', 404));
  }

  await Admin.findByIdAndDelete(pathologyCenter.adminId);
  await PathologyCenter.findByIdAndDelete(pathologyCenterId);

  return successRes(res, 200, true, 'Pathology Center and associated admin deleted successfully.');
});


// module.exports.updatePathologyCenter = asyncErrorHandler(async (req, res, next) => {
//   const { pathologyCenterId, email, centerName, ownerName, phoneNumber, address } = req.body;

//   if (!pathologyCenterId) {
//     return next(new CustomError("Pathology Center Id is required", 400));
//   }

//   const updateFields = {};
//   if (centerName) updateFields.centerName = centerName;
//   if (ownerName) updateFields.ownerName = ownerName;
//   if (phoneNumber) updateFields.phoneNumber = phoneNumber;
//   if (address) updateFields.address = address;
//   if (email) updateFields.email = email;

//   if (Object.keys(updateFields).length === 0) {
//     return next(new CustomError("No fields provided for update", 400));
//   }

//   // Update PathologyCenter
//   const updatedPathologyCenter = await PathologyCenter.findByIdAndUpdate(
//     pathologyCenterId,
//     { $set: updateFields },
//     { new: true, runValidators: true }
//   );

//   if (email) {
//     const adminUpdateFields = { email };
//     await Admin.findOneAndUpdate(
//       { pathologyCenterId: pathologyCenterId },
//       { $set: adminUpdateFields },
//       { new: true }
//     );
//   }

//   return successRes(res, 200, true, "Pathology Center and Admin updated successfully", updatedPathologyCenter);
// });
module.exports.updatePathologyCenter = asyncErrorHandler(async (req, res, next) => {
  const admin = req.admin; // coming from middleware

  const { pathologyCenterId, email, centerName, phoneNumber, address } = req.body;

  if (!pathologyCenterId) {
    return next(new CustomError("Pathology Center Id is required", 400));
  }

  const updateFields = {};
  if (centerName) updateFields.centerName = centerName;
  if (phoneNumber) updateFields.phoneNumber = phoneNumber;
  if (address) updateFields.address = address;
  if (email) updateFields.email = email;

  if (Object.keys(updateFields).length === 0) {
    return next(new CustomError("No fields provided for update", 400));
  }

  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    // Update Pathology Center
    const updatedPathologyCenter = await PathologyCenter.findByIdAndUpdate(
      pathologyCenterId,
      { $set: updateFields },
      { new: true, runValidators: true, session }
    );

    if (!updatedPathologyCenter) {
      return next(new CustomError("Pathology Center not found", 404));
    }

    //  Update the associated Admin using admin._id
    // let updatedAdmin = null;
    // if (email || centerName) {
    //   const adminUpdateFields = {};
    //   if (email) adminUpdateFields.email = email;
    //   if (centerName) adminUpdateFields.name = centerName;

    //   updatedAdmin = await Admin.findByIdAndUpdate(
    //     admin._id,
    //     { $set: adminUpdateFields },
    //     { new: true, session }
    //   );

    //   if (!updatedAdmin) {
    //     return next(new CustomError("Admin not found", 400));
    //   }
    // }

    await session.commitTransaction();

    // const sanitizedAdmin = updatedAdmin ? updatedAdmin.toObject() : {};
    // if (sanitizedAdmin.password) delete sanitizedAdmin.password;

    return successRes(res, 200, true, "Pathology Center and Admin updated successfully", {
      pathologyCenter: updatedPathologyCenter,
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});




module.exports.getAllPathologyCenters = asyncErrorHandler(async (req, res, next) => {
  let { page, limit } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const [totalPathologyCenters, allPathologyCenters] = await Promise.all([
    PathologyCenter.countDocuments(),
    PathologyCenter.find().populate("adminId").sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  if (allPathologyCenters.length === 0) {
    return successRes(res, 200, false, "No Pathology Centers Found", []);
  }

  return successRes(res, 200, true, "Pathology Centers fetched successfully", {
    pathologyCenters: allPathologyCenters,
    currentPage: page,
    totalPages: Math.ceil(totalPathologyCenters / limit),
    totalPathologyCenters,
  });
});

module.exports.searchPathology = asyncErrorHandler(async (req, res, next) => {
  let { value } = req.query;
  let page, limit

  if (!value) {
    return next(new CustomError("Search value is required", 400));
  }
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const regex = new RegExp(value, 'i');
  const searchQuery = {
    $or: [
      { centerName: regex },
      { email: regex }
    ]
  };

  const [totalPatholody, allPathology] = await Promise.all([
    PathologyCenter.countDocuments(searchQuery),
    PathologyCenter.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  if (allPathology.length === 0) {
    return successRes(res, 200, false, "No Pathology Found", []);
  }

  return successRes(res, 200, true, "Pathology fetched successfully", {
    pathologies: allPathology,
    currentPage: page,
    totalPages: Math.ceil(totalPatholody / limit),
    totalPatholody
  });
});





