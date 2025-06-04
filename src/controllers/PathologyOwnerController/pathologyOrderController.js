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

module.exports.cancelOrderFromPathology = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;
  const { orderId ,reason} = req.body;

  if (!reason) {
    return next(new CustomError("Cancellation reason is required", 400));
  }

  const pathology = await PathologyCenter.findOne({ adminId });
  if (!pathology) {
    return next(new CustomError("Pathology Center not found", 404));
  }

  console.log("pahology", pathology);
  const pathologyId = pathology._id;

  const order = await PathologyOrder.findById(orderId);
  if (!order) {
    return next(new CustomError("Order not found", 404));
  }

  const attemptIndex = order.pathologyAttempts.findIndex(
    (attempt) =>
      attempt.pathologyId.toString() === pathologyId.toString() &&
      attempt.status === "pending"
  );

  if (attemptIndex === -1) {
    return next(new CustomError("No pending attempt found for this pathology center", 400));
  }

  order.pathologyAttempts[attemptIndex].status = "rejected";

  // If this pathology was assigned (not just attempted) mark order as cancelled
  if (order.pathologyCenterId?.toString() === pathologyId.toString()) {
    order.orderStatus = "cancelled";
    order.cancellationReason = reason;
  }

  await order.save();

  return successRes(res, 200, true, "Order cancelled successfully", order);
});


