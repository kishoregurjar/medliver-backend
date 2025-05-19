const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const InsuranceLead = require("../../modals/insurence.model");
const { successRes } = require("../../services/response");
require("dotenv").config();

// module.exports.getAllInsuranceLeads = asyncErrorHandler(
//   async (req, res, next) => {
//     let { page, limit, is_archived } = req.query;

//     page = parseInt(page) || 1;
//     limit = parseInt(limit) || 10;
//     const skip = (page - 1) * limit;

//     const [totalLeads, leads] = await Promise.all([
//       InsuranceLead.countDocuments(),
//       InsuranceLead.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
//     ]);

//     if (leads.length === 0) {
//       return successRes(res, 200, false, "No Insurance Leads Found", []);
//     }

//     return successRes(res, 200, true, "Insurance Leads fetched successfully", {
//       leads,
//       currentPage: page,
//       totalPages: Math.ceil(totalLeads / limit),
//       totalLeads,
//     });
//   }
// );
module.exports.getAllInsuranceLeads = asyncErrorHandler(
  async (req, res, next) => {
    let { page, limit, is_archived } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    // Construct the filter query for archived status
    let filterQuery = {};
    if (is_archived !== undefined) {
      filterQuery.is_archived = is_archived === 'true';
    }


    const [totalLeads, leads] = await Promise.all([
      InsuranceLead.countDocuments(filterQuery),
      InsuranceLead.find(filterQuery).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    if (leads.length === 0) {
      return successRes(res, 200, false, "No Insurance Leads Found", []);
    }

    return successRes(res, 200, true, "Insurance Leads fetched successfully", {
      leads,
      currentPage: page,
      totalPages: Math.ceil(totalLeads / limit),
      totalLeads,
    });
  }
);


// GET insurance lead by ID
module.exports.getInsuranceById = asyncErrorHandler(async (req, res, next) => {
  const { insuranceId } = req.query;

  if (!insuranceId) {
    return next(new CustomError("Insurance ID is required", 400));
  }

  const lead = await InsuranceLead.findById(insuranceId);
  if (!lead) {
    return next(new CustomError("Insurance Lead not found", 404));
  }

  return successRes(
    res,
    200,
    true,
    "Insurance Lead fetched successfully",
    lead
  );
});

module.exports.archiveInsuranceById = asyncErrorHandler(
  async (req, res, next) => {
    const { insuranceId, is_archived } = req.body;

    // Validate input
    if (!insuranceId) {
      return next(new CustomError("Insurance ID is required", 400));
    }

    if (typeof is_archived !== 'boolean') {
      return next(new CustomError("is_archived must be a boolean value", 400));
    }

    // Update the insurance lead
    const insurance = await InsuranceLead.findByIdAndUpdate(
      insuranceId,
      { $set: { is_archived } },
      { new: true }
    );

    // If insurance not found
    if (!insurance) {
      return next(new CustomError("Insurance Lead not found", 404));
    }

    // Return success response
    return successRes(
      res,
      200,
      true,
      `Insurance Lead ${is_archived ? "archived" : "unarchived"} successfully`,
      insurance
    );
  }
);


module.exports.searchInsuranceLead = asyncErrorHandler(async (req, res, next) => {
  const { query } = req.query;
  if (!query) {
    return next(new CustomError("Please Provide Search Query", 400))
  }

  const leads = await InsuranceLead.find({
    $or: [
      { full_name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
    ],
  });

  return successRes(res, 200, true, "Insurance leads fetched successfully", leads)
});
