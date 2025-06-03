const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const mongoose = require("mongoose");
const PathologyCenter = require("../../modals/pathology.model");
const PathologyOrder = require("../../modals/orderPathologyModel"); // adjust path accordingly

module.exports.viewAllAssignedTestBooking = asyncErrorHandler(
  async (req, res, next) => {
    const adminId = req.admin._id;

    const pathology = await PathologyCenter.findOne({ adminId });

    if (!pathology) {
      return next(new CustomError("Pathology Center not found", 404));
    }

    const pathologyId = pathology._id;

    const assignedOrders = await PathologyOrder.find({
      orderStatus: "pending",
      pathologyAttempts: {
        $elemMatch: {
          pathologyId: pathologyId,
          status: "pending"
        }
      }
    })
    .populate("customerId", "fullName phoneNumber")
    .populate("selectedTests.testId", "name price")

    return successRes(
      res,
      200,
      true,
      "Assigned test bookings fetched successfully",
      assignedOrders
    );
  }
);



module.exports.getAllAcceptedTestBooking = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;

  const pathology = await PathologyCenter.findOne({ adminId });

  if (!pathology) {
    return next(new CustomError("Pathology Center not found", 404));
  }

  const pathologyId = pathology._id;

  const assignedOrders = await PathologyOrder.find({
    orderStatus: "accepted_by_pathology",
    pathologyCenterId: pathologyId
  })
  .populate("customerId", "fullName phoneNumber")
  .populate("selectedTests.testId", "name price")

  

  return successRes(
    res,
    200,
    assignedOrders.length > 0 ? true : false, 
    "Accepted test bookings fetched successfully",
    assignedOrders
  );
}); 
  