const DoctorLead = require("../../modals/doctoreLead.model")
const asyncErrorHandler = require("../../utils/asyncErrorHandler")
const CustomError = require("../../utils/customError")
const { successRes } = require("../../services/response")


// Get All Leads
module.exports.getAllUser = asyncErrorHandler(async (req, res, next) => {
  let { page, limit, sortOrder } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const sortDir = sortOrder?.toLowerCase() === "asc" ? 1 : -1; //default desc

  const [total, user] = await Promise.all([
    DoctorLead.countDocuments(),
    DoctorLead.find()
      .sort({ createdAt: sortDir })
      .skip(skip)
      .limit(limit),
  ]);

  if (user.length === 0) {
    return successRes(res, 200, false, "No User Found", []);
  }

  return successRes(res, 200, true, "Customers fetched successfully", {
    user,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    total,
  });
});

// Get Lead by ID
module.exports.getDoctorLeadById = asyncErrorHandler(async (req, res, next) => {
  const { DoctoreLeadId } = req.query;
  if (!DoctoreLeadId) {
    return next(new CustomError("Doctor lead  id is required", 404));

  }
  const lead = await DoctorLead.findById(DoctoreLeadId);

  if (!lead) {
    return next(new CustomError("Doctor lead not found", 404));
  }

  return successRes(res, 200, true, "Doctor lead fetched successfully", lead);
});

// Update Lead
module.exports.updateDoctorLead = asyncErrorHandler(async (req, res, next) => {
  const { DoctoreLeadId, name, email, phone, address, disease, isArchived } = req.body;

  const updateData = { updated_at: new Date() };
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  if (disease) updateData.disease = disease;
  if (isArchived !== undefined) updateData.isArchived = isArchived;

  if (Object.keys(updateData).length === 0) {
    return next(new CustomError("No fields provided for update", 400));
  }

  const updatedRequest = await DoctorLead.findByIdAndUpdate(
    DoctoreLeadId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedRequest) {
    return next(new CustomError("Vehicle Request not found", 404));
  }

  return successRes(res, 200, true, "Doctor lead updated successfully", updatedRequest);
});

module.exports.deleteDoctorLeadById = asyncErrorHandler(async (req, res, next) => {
  const { DoctoreLeadId } = req.query;

  if (!DoctoreLeadId) {
    return next(new CustomError("Doctor lead Id  is required", 404));

  }
  const lead = await DoctorLead.findByIdAndDelete(DoctoreLeadId);

  if (!lead) {
    return next(new CustomError("Doctor lead not found", 404));
  }

  return successRes(res, 200, true, "Doctor lead deleted successfully", lead);
});

module.exports.searchDoctorLead = asyncErrorHandler(async (req, res, next) => {
  let { query } = req.query;
  if (!query) {
    return next(new CustomError("Please Provide Search Query", 400))
  }

  const leads = await DoctorLead.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
      { address: { $regex: query, $options: "i" } },
      { disease: { $regex: query, $options: "i" } },
    ],
  });

  return successRes(res, 200, true, "Doctor leads fetched successfully", leads)
})