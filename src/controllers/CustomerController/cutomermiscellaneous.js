
const InsuranceLead = require("../../modals/insurence.model")
const EmergencyVehicleBooking = require("../../modals/emergencyVehicleBooking.model")
const CustomError = require("../../utils/customError")
const { successRes } = require("../../services/response")
const asyncErrorHandler = require("../../utils/asyncErrorHandler")
const DoctoreLead = require("../../modals/doctoreLead.model")

module.exports.applyInsurance = asyncErrorHandler(async (req, res, next) => {
    const { 
      full_name, 
      phone_number, 
      email, 
      lead_type, 
      age, 
      gender, 
      coverage_for, 
      family_member_count, 
      nominee_name, 
      nominee_relation, 
      income, 
      lead_source 
    } = req.body;
  
    if (!full_name || !phone_number || !lead_type || !age || !gender || !coverage_for) {
      return next(new CustomError("All required fields must be provided", 400));
    }
  
    if (!['health', 'life'].includes(lead_type)) {
      return next(new CustomError("Invalid lead type", 400));
    }
    if (lead_type === 'life' && !income) {
      return next(new CustomError("Income is required for life insurance leads", 400));
    }
  
    if (!['self', 'family'].includes(coverage_for)) {
      return next(new CustomError("Invalid coverage type", 400));
    }
  
    if (coverage_for === 'family' && !family_member_count) {
      return next(new CustomError("Family member count is required for family coverage", 400));
    }
  
    if (coverage_for === 'self' && family_member_count) {
      return next(new CustomError("Family member count should not be provided for self coverage", 400));
    }
  
    const insuranceLead = new InsuranceLead({
      full_name,
      phone_number,
      email,
      lead_type,
      age,
      gender,
      coverage_for,
      family_member_count, 
      nominee_name,
      nominee_relation,
      income, 
      lead_source
    });
  
    await insuranceLead.save();
  
    return successRes(res, 201, true, "Insurance application submitted successfully", insuranceLead);
  });
  
  module.exports.requestEmergencyVehicle = asyncErrorHandler(async (req, res, next) => {
    const {
      patient_name,
      patient_phone,
      emergency_type,
      location,
      address,
      destination_hospital,
      vehicle_type,
    } = req.body;
  
    if (!patient_name || !patient_phone || !emergency_type || !location || !address || !vehicle_type) {
      return next(new CustomError("All required fields must be provided", 400));
    }
  
    if (typeof location !== 'object' || location.lat == null || location.lng == null) {
      return next(new CustomError("Location must include lat and lng", 400));
    }
  
    const newRequest = await EmergencyVehicleBooking.create({
      patient_name,
      patient_phone,
      emergency_type,
      location,
      address,
      destination_hospital,
      vehicle_type,
    });
  
    return successRes(res, 201, true, "Emergency vehicle requested successfully", newRequest);
  });
  
  module.exports.createDoctoreLead = asyncErrorHandler(async (req, res, next) => {
    const {
      name,
      email,
      phone,
      address,
      disease,
    } = req.body;
  
    if (!name || !email) {
      return next(new CustomError("Name and Email are required", 400));
    }
  
    const existingUser = await DoctoreLead.findOne({ name: name.trim(), email });
    if (existingUser) {
      return next(
        new CustomError("User with same name and email already exists", 409)
      );
    }
    const newUser = await DoctoreLead.create({
      name,
      email,
      phone,
      address,
      disease,
    });
    return successRes(res, 201, true, "User created successfully", newUser);
  });