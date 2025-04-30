const adminSchema = require("../../modals/admin.Schema");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const CustomError = require("../../utils/customError");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
// const { assignJwt } = require('../utils/jwtToken');
const { assignJwt } = require("../../utils/jsonWebToken");
const { forgetPasswordMail } = require("../../services/sendMail");
const { JsonWebTokenError } = require("jsonwebtoken");
const DeliveryPartner = require("../../modals/delivery.model");
const Customer = require("../../modals/customer.model");
const deliveryRateModel = require("../../modals/deliveryRate.model");
require("dotenv").config();

/** ----------Delivery Partner ---------------- */

module.exports.approveRejectDeliveryPartner = asyncErrorHandler(
  async (req, res, next) => {
    const { partnerId, status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return next(new CustomError("Invalid status provided", 400));
    }
    const adminId = req.admin._id;
    if (!partnerId) {
      return next(new CustomError("Partner ID is required", 400));
    }

    const findAdmin = await adminSchema.findById(adminId);
    if (!findAdmin) {
      return next(new CustomError("Admin not found", 404));
    }

    const findPartner = await DeliveryPartner.findById(partnerId);
    if (!findPartner) {
      return next(new CustomError("Delivery Partner not found", 404));
    }

    if (!findPartner.isVerified) {
      return next(new CustomError("Partner's email is not verified", 400));
    }

    findPartner.approvalStatus = status;
    await findPartner.save();

    return successRes(
      res,
      200,
      true,
      status === "approved" ? "Delivery Partner approved successfully." : "Delivery Partner rejected successfully."
    );
  }
);

//by id
module.exports.getDeliveryPartnerById = asyncErrorHandler(
  async (req, res, next) => {
    const { partnerId } = req.query;

    if (!partnerId) {
      return next(new CustomError("Delivery Partner Id is required", 400));
    }
    const partner = await DeliveryPartner.findById(partnerId).select(
      "-password -otp"
    );

    if (!partner) {
      return next(new CustomError("Delivery Partner not found", 404));
    }

    return successRes(
      res,
      200,
      true,
      "Delivery Partner fetched successfully",
      partner
    );
  }
);

//get all
module.exports.getAllDeliveryPartners = asyncErrorHandler(
  async (req, res, next) => {
    let { page, limit } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const [total, partners] = await Promise.all([
      DeliveryPartner.countDocuments(),
      DeliveryPartner.find()
        .select("-password -otp")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    if (partners.length === 0) {
      return successRes(res, 200, false, "No Delivery Partners Found", []);
    }

    return successRes(
      res,
      200,
      true,
      "Delivery Partners fetched successfully",
      {
        partners,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      }
    );
  }
);

//delete
module.exports.deleteDeliveryPartner = asyncErrorHandler(
  async (req, res, next) => {
    const { partnerId } = req.query;

    if (!partnerId) {
      return next(new CustomError("Delivery Partner Id is required", 400));
    }

    const deleted = await DeliveryPartner.findByIdAndDelete(partnerId);

    if (!deleted) {
      return next(new CustomError("Delivery Partner not found", 404));
    }

    return successRes(
      res,
      200,
      true,
      "Delivery Partner deleted successfully",
      deleted
    );
  }
);

//update
module.exports.updateDeliveryPartner = asyncErrorHandler(
  async (req, res, next) => {
    const { partnerId } = req.body;

    if (!partnerId) {
      return next(new CustomError("Delivery Partner ID is required", 400));
    }

    const {
      fullname,
      phone,
      email,
      profilePhoto,
      documents,
      emergencyContacts,
    } = req.body;

    const updateFields = {};

    if (fullname) updateFields.fullname = fullname;
    if (phone) updateFields.phone = phone;
    if (email) updateFields.email = email.toLowerCase();
    if (profilePhoto) updateFields.profilePhoto = profilePhoto;

    // Optional documents
    if (documents) {
      updateFields.documents = {};
      if (documents.aadharNumber)
        updateFields.documents.aadharNumber = documents.aadharNumber;
      if (documents.licenseNumber)
        updateFields.documents.licenseNumber = documents.licenseNumber;
      if (documents.idProof) updateFields.documents.idProof = documents.idProof;
    }

    if (emergencyContacts && Array.isArray(emergencyContacts)) {
      updateFields.emergencyContacts = emergencyContacts;
    }

    if (Object.keys(updateFields).length === 0) {
      return next(new CustomError("No fields provided for update", 400));
    }

    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
      partnerId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedPartner) {
      return next(new CustomError("Delivery Partner not found", 404));
    }

    return successRes(
      res,
      200,
      true,
      "Delivery Partner updated successfully",
      updatedPartner
    );
  }
);

module.exports.updateAvailabilityStatus = asyncErrorHandler(
  async (req, res, next) => {
    const { partnerId, availabilityStatus } = req.body;

    if (!partnerId) {
      return next(new CustomError("Delivery Partner ID is required", 400));
    }
    const validStatuses = ["available", "on-delivery", "offline"];

    if (!availabilityStatus || !validStatuses.includes(availabilityStatus)) {
      return next(
        new CustomError("Invalid or missing availability status", 400)
      );
    }

    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
      partnerId,
      { $set: { availabilityStatus } },
      { new: true, runValidators: true }
    );

    if (!updatedPartner) {
      return next(new CustomError("Delivery Partner not found", 404));
    }

    return successRes(
      res,
      200,
      true,
      "Availability status updated successfully",
      updatedPartner
    );
  }
);

module.exports.BlockUnblockDeliveryPartner = asyncErrorHandler(
  async (req, res, next) => {
    const { partnerId } = req.body;

    if (!partnerId) {
      return next(new CustomError("Delivery Partner ID is required", 400));
    }
    const existingPartner = await DeliveryPartner.findById(partnerId);

    if (!existingPartner) {
      return next(new CustomError("Delivery Partner not found", 404));
    }
    const newStatus = !existingPartner.isBlocked;
    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
      partnerId,
      { isBlocked: newStatus },
      { new: true, runValidators: false }
    );
    const statusMessage = newStatus
      ? "Delivery partner blocked successfully"
      : "Delivery partner unblocked successfully";

    return successRes(res, 200, true, statusMessage, updatedPartner);
  }
);

module.exports.searchDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
  const { query } = req.query;
  if (!query) {
    return next(new CustomError("Search query is required", 400));
  }
  const partners = await DeliveryPartner.find({
    $or: [
      { fullname: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
    ],
  });
  return successRes(res, 200, partners.length > 0 ? true : false, "Delivery Partners", partners);
})

module.exports.getAllDeliveryPartnersNotApproved = asyncErrorHandler(async (req, res, next) => {
  let { status } = req.query;
  const partners = await DeliveryPartner.find({ approvalStatus: status });
  if (partners.length === 0) {
    return successRes(res, 200, false, "No Delivery Partners Found", []);
  }
  return successRes(res, 200, true, "Delivery Partners", partners);
})

/** Set Delivery Rate */

module.exports.setDeliveryRate = asyncErrorHandler(async (req, res, next) => {
  let { deliveryRate } = req.body;
  const adminId = req.admin._id;

  if (!deliveryRate) {
    return next(new CustomError("Delivery Rate is required", 400));
  }
  deliveryRate = Number(deliveryRate);
  if (typeof deliveryRate !== "number" || deliveryRate <= 0) {
    return next(new CustomError("Delivery Rate must be a positive number", 400));
  }

  await deliveryRateModel.updateMany(
    { created_by: adminId, is_active: true },
    { $set: { is_active: false } }
  );

  const newRate = await deliveryRateModel.create({
    per_km_price: deliveryRate,
    created_by: adminId,
    is_active: true,
    created_at: new Date()
  });

  return successRes(res, 201, true, "New Delivery Rate Created Successfully", newRate);
});

module.exports.getDeliveryRates = asyncErrorHandler(async (req, res, next) => {
  let status = req.query.status;
  if (!status) {
    status = true;
  }
  const rates = await deliveryRateModel.find({ is_active: status });
  return successRes(res, 200, rates.length > 0 ? true : false, "Delivery Rates", rates);
});

module.exports.editPerKilometerPrice = asyncErrorHandler(async (req, res, next) => {
  let { deliveryRate, rateId } = req.body;
  const adminId = req.admin._id;

  if (!deliveryRate) {
    return next(new CustomError("Delivery Rate is required", 400));
  }
  deliveryRate = Number(deliveryRate);
  if (typeof deliveryRate !== "number" || deliveryRate <= 0) {
    return next(new CustomError("Delivery Rate must be a positive number", 400));
  }
  const findRate = await deliveryRateModel.findById(rateId);
  if (!findRate) {
    return next(new CustomError("Delivery Rate not found", 404));
  }
  if (findRate.created_by.toString() !== adminId.toString()) {
    return next(new CustomError("You are not authorized to edit this rate", 403));
  }
  findRate.per_km_price = deliveryRate;
  await findRate.save();
  return successRes(res, 200, true, "Delivery Rate Updated Successfully", findRate);
})

module.exports.activateParticularRate = asyncErrorHandler(async (req, res, next) => {
  const { rateId } = req.body;
  const adminId = req.admin._id;

  if (!rateId) {
    return next(new CustomError("Rate ID is required", 400));
  }

  const findRate = await deliveryRateModel.findById(rateId);
  if (!findRate) {
    return next(new CustomError("Delivery Rate not found", 404));
  }

  await deliveryRateModel.updateMany(
    { _id: { $ne: rateId }, created_by: adminId, is_active: true },
    { $set: { is_active: false } }
  );

  findRate.is_active = true;
  await findRate.save();

  return successRes(res, 200, true, "Delivery Rate Activated Successfully", findRate);
});

module.exports.deleteDeliveryRate = asyncErrorHandler(async (req, res, next) => {
  const { rateId } = req.body;
  const adminId = req.admin._id;

  if (!rateId) {
    return next(new CustomError("Rate ID is required", 400));
  }

  const findRate = await deliveryRateModel.findById(rateId);
  if (!findRate) {
    return next(new CustomError("Delivery Rate not found", 404));
  }
  if (findRate.is_active) {
    return next(new CustomError("You can't delete an active rate", 400));
  }

  if (findRate.created_by.toString() !== adminId.toString()) {
    return next(new CustomError("You are not authorized to delete this rate", 403));
  }

  await findRate.deleteOne();
  return successRes(res, 200, true, "Delivery Rate Deleted Successfully", findRate);
});
