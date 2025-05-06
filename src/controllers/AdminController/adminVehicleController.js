const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError")
const EmergencyVehicleBooking = require("../../modals/emergencyVehicleBooking.model");
const { successRes } = require("../../services/response")

module.exports.getAllVehicleRequests = asyncErrorHandler(async (req, res, next) => {
  let { page, limit, sortOrder } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const sortDir = sortOrder?.toLowerCase() === "asc" ? 1 : -1; // default is descending

  const [total, vehicleRequests] = await Promise.all([
    EmergencyVehicleBooking.countDocuments(),
    EmergencyVehicleBooking.find().sort({ createdAt: sortDir }).skip(skip).limit(limit),
  ]);

  if (vehicleRequests.length === 0) {
    return successRes(res, 200, false, "No Vehicle Requests Found", []);
  }

  return successRes(res, 200, true, "Vehicle Requests fetched successfully", {
    vehicleRequests,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    total,
  });
});

module.exports.getVehicleRequestById = asyncErrorHandler(async (req, res, next) => {
  const { vehiclerequestId } = req.query;

  if (!vehiclerequestId) {
    return next(new CustomError("Request ID is required", 400));
  }

  const vehicleRequest = await EmergencyVehicleBooking.findById(vehiclerequestId);

  if (!vehicleRequest) {
    return next(new CustomError("Vehicle Request not found", 404));
  }

  return successRes(res, 200, true, "Vehicle Request fetched successfully", vehicleRequest);
});

module.exports.updateVehicleRequest = asyncErrorHandler(async (req, res, next) => {
  const { vehiclerequestId, patient_name, patient_phone, emergency_type, location, address, destination_hospital, vehicle_type } = req.body;

  if (!vehiclerequestId) {
    return next(new CustomError("Request ID is required", 400));
  }

  const updateFields = {};
  if (patient_name) updateFields.patient_name = patient_name;
  if (patient_phone) updateFields.patient_phone = patient_phone;
  if (emergency_type) updateFields.emergency_type = emergency_type;
  if (location) updateFields.location = location;
  if (address) updateFields.address = address;
  if (destination_hospital) updateFields.destination_hospital = destination_hospital;
  if (vehicle_type) updateFields.vehicle_type = vehicle_type;

  if (Object.keys(updateFields).length === 0) {
    return next(new CustomError("No fields provided for update", 400));
  }

  const updatedRequest = await EmergencyVehicleBooking.findByIdAndUpdate(
    vehiclerequestId,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!updatedRequest) {
    return next(new CustomError("Vehicle Request not found", 404));
  }

  return successRes(res, 200, true, "Vehicle Request updated successfully", updatedRequest);
});

module.exports.archiveVehicleRequest = asyncErrorHandler(async (req, res, next) => {
  const { vehiclerequestId } = req.body;

  if (!vehiclerequestId) {
    return next(new CustomError("Request ID is required", 400));
  }

  const updatedRequest = await EmergencyVehicleBooking.findByIdAndUpdate(
    vehiclerequestId,
    { archived: true },
    { new: true, runValidators: true }
  );

  if (!updatedRequest) {
    return next(new CustomError("Vehicle Request not found", 404));
  }

  return successRes(res, 200, true, "Vehicle Request archived successfully", updatedRequest);
});
