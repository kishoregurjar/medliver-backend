const adminSchema = require('../../modals/admin.Schema');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const CustomError = require('../../utils/customError');
const { successRes } = require('../../services/response');
const asyncErrorHandler = require('../../utils/asyncErrorHandler');
// const { assignJwt } = require('../utils/jwtToken');
const { assignJwt } = require("../../utils/jsonWebToken");
const { forgetPasswordMail } = require('../../services/sendMail');
const { JsonWebTokenError } = require('jsonwebtoken');
const DeliveryPartner = require('../../modals/delivery.model')
const Customer = require('../../modals/customer.model');
require('dotenv').config();


/** ----------Delivery Partner ---------------- */

module.exports.approveDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const { partnerId } = req.body;
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

    if (findPartner.isApproved) {
        return next(new CustomError("Partner is already approved", 400));
    }

    findPartner.isApproved = true;
    await findPartner.save();

    return successRes(res, 200, true, "Delivery Partner approved successfully.");
});

//by id
module.exports.getDeliveryPartnerById = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPartnerId } = req.query;

    if (!deliveryPartnerId) {
        return next(new CustomError("Delivery Partner Id is required", 400));
    }
    const partner = await DeliveryPartner.findById(deliveryPartnerId).select("-password -otp");

    if (!partner) {
        return next(new CustomError("Delivery Partner not found", 404));
    }

    return successRes(res, 200, true, "Delivery Partner fetched successfully", partner);
});

//get all
module.exports.getAllDeliveryPartners = asyncErrorHandler(async (req, res, next) => {
    let { page, limit } = req.query;
    // const admin = req.admin;

    // if (!admin || admin.role !== "superadmin") {
    //     return next(new CustomError("Access denied: Only superadmin can perform this action", 403));
    //   }

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const [total, partners] = await Promise.all([
        DeliveryPartner.countDocuments(),
        DeliveryPartner.find().select("-password -otp").sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    if (partners.length === 0) {
        return successRes(res, 200, false, "No Delivery Partners Found", []);
    }

    return successRes(res, 200, true, "Delivery Partners fetched successfully", {
        partners,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
    });
});

//delete
module.exports.deleteDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPartnerId } = req.query;
    const admin = req.admin;

    if (!admin || admin.role !== "superadmin") {
        return next(new CustomError("Access denied: Only superadmin can perform this action", 403));
    }

    if (!deliveryPartnerId) {
        return next(new CustomError("Delivery Partner Id is required", 400));
    }

    const deleted = await DeliveryPartner.findByIdAndDelete(deliveryPartnerId);

    if (!deleted) {
        return next(new CustomError("Delivery Partner not found", 404));
    }

    return successRes(res, 200, true, "Delivery Partner deleted successfully", deleted);
});

//update 
module.exports.updateDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPartnerId } = req.body;

    if (!deliveryPartnerId) {
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
        if (documents.aadharNumber) updateFields.documents.aadharNumber = documents.aadharNumber;
        if (documents.licenseNumber) updateFields.documents.licenseNumber = documents.licenseNumber;
        if (documents.idProof) updateFields.documents.idProof = documents.idProof;
    }

    if (emergencyContacts && Array.isArray(emergencyContacts)) {
        updateFields.emergencyContacts = emergencyContacts;
    }

    if (Object.keys(updateFields).length === 0) {
        return next(new CustomError("No fields provided for update", 400));
    }

    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
        deliveryPartnerId,
        { $set: updateFields },
        { new: true, runValidators: true }
    );

    if (!updatedPartner) {
        return next(new CustomError("Delivery Partner not found", 404));
    }

    return successRes(res, 200, true, "Delivery Partner updated successfully", updatedPartner);
});

//update status
module.exports.updateAvailabilityStatus = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPartnerId, availabilityStatus } = req.body;

    if (!deliveryPartnerId) {
        return next(new CustomError("Delivery Partner ID is required", 400));
    }

    const validStatuses = ["available", "on-delivery", "offline"];

    if (!availabilityStatus || !validStatuses.includes(availabilityStatus)) {
        return next(new CustomError("Invalid or missing availability status", 400));
    }

    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
        deliveryPartnerId,
        { $set: { availabilityStatus } },
        { new: true, runValidators: true }
    );

    if (!updatedPartner) {
        return next(new CustomError("Delivery Partner not found", 404));
    }

    return successRes(res, 200, true, "Availability status updated successfully", updatedPartner);
});

//block
module.exports.blockDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPartnerId } = req.body;
    const admin = req.admin;

    if (!admin || admin.role !== "superadmin") {
        return next(new CustomError("Only superadmin can blocked delivery partners", 403));
    }

    if (!deliveryPartnerId) {
        return next(new CustomError("Delivery Partner ID is required", 400));
    }

    const isBlocked = await DeliveryPartner.findById(deliveryPartnerId);
    if (isBlocked.isBlocked) {
        return next(new CustomError("Delivery Partner is already blocked", 400));
    }

    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
        deliveryPartnerId,
        { $set: { isBlocked: true } },
        { new: true, runValidators: true }
    );

    if (!updatedPartner) {
        return next(new CustomError("Delivery Partner not found", 404));
    }

    return successRes(res, 200, true, "Delivery Partner blocked successfully", updatedPartner);
});

//unblock
module.exports.unblockDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPartnerId } = req.body;
    const admin = req.admin;

    if (!admin || admin.role !== "superadmin") {
        return next(new CustomError("Only superadmin can unblock delivery partners", 403));
    }

    if (!deliveryPartnerId) {
        return next(new CustomError("Delivery Partner ID is required", 400));
    }

    const partner = await DeliveryPartner.findById(deliveryPartnerId);

    if (!partner) {
        return next(new CustomError("Delivery Partner not found", 404));
    }

    if (!partner.isBlocked) {
        return next(new CustomError("Delivery Partner is already unblocked", 400));
    }


    partner.isBlocked = false;
    await partner.save();

    return successRes(res, 200, true, "Delivery Partner unblocked successfully", partner);
});