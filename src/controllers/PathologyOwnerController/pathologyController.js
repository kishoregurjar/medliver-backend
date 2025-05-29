const TestModel = require("../../modals/test.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const mongoose = require("mongoose");
const PathologyCenter = require("../../modals/pathology.model");

module.exports.getMyPathologyCenter = asyncErrorHandler(async (req, res, next) => {
  const admin = req.admin;

  const pathology = await PathologyCenter.findOne({ adminId: admin._id }, { availableTests: 0 }).populate("commissionId", "-pathologyCenterId");;

  if (!pathology) return next(new CustomError("This Center is not found", 404));

  return successRes(res, 200, true, "Center fetched", pathology);
});

module.exports.changePathologyAvailabilityStatus = asyncErrorHandler(async (req, res, next) => {
  const { availabilityStatus } = req.body;
  const admin = req.admin;

  if (!availabilityStatus) {
    return next(new CustomError("availabilityStatus is required", 400));
  }
  if (!["available", "unavailable"].includes(availabilityStatus)) {
    return next(new CustomError("Status is invalid", 400));
  }

  const pathology = await PathologyCenter.findOne({ adminId: admin._id });
  if (!pathology) {
    return next(new CustomError("Pathology center not found", 404));
  }

  pathology.availabilityStatus = availabilityStatus;
  await pathology.save();

  return successRes(res, 200, true, "Status changed successfully", pathology);
});