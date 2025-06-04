const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const mongoose = require("mongoose");
const PathologyCenter = require("../../modals/pathology.model");
const PathologyOrder = require("../../modals/orderPathologyModel");
const customerAddressModel = require("../../modals/customerAddress.model");
const { getDistance } = require("../../utils/helper");
const notificationModel = require("../../modals/notification.model");
const { sendExpoNotification } = require("../../utils/expoNotification");

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
      pathologyCenterId: pathologyId
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

module.exports.acceptOrRejectTestOrder = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;
  const { orderId, status } = req.body;

  if (!orderId || !status) {
    return next(new CustomError("Order ID and status are required", 400));
  }

  if (!["accepted", "rejected"].includes(status)) {
    return next(new CustomError("Invalid status", 400));
  }

  const [order, pathology] = await Promise.all([
    PathologyOrder.findById(orderId),
    PathologyCenter.findOne({ adminId }),
  ]);

  if (!order) return next(new CustomError("Order not found", 404));
  if (!pathology) return next(new CustomError("Pathology center not found", 404));

  // Common push object for pathologyAttempts
  const pathologyAttempt = {
    pathologyCenterId: pathology._id,
    status,
    attemptedAt: new Date(),
  };

  order.pathologyAttempts.push(pathologyAttempt);

  if (status === "accepted") {
    order.orderStatus = "accepted_by_pathology";
    await order.save();
    return successRes(res, 200, true, "Order status updated successfully", order);
  }

  // If rejected, find nearest available center (excluding current one)
  order.orderStatus = "pending"; // Keep it pending unless no partner available

  const [allCenters, userAddress] = await Promise.all([
    PathologyCenter.find({
      isActive: true,
      availabilityStatus: "available",
      deviceToken: { $ne: null },
      centerCoordinates: { $ne: null },
    }),
    customerAddressModel.findById(order.addressId),
  ]);

  const userCoords = userAddress?.location;
  console.log(userAddress, "userAddress")

  if (!userCoords) {
    return next(new CustomError("User address not found or invalid", 400));
  }

  const sortedCenters = allCenters
    .map((center) => ({
      center,
      distance: getDistance(userCoords, center.centerCoordinates),
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.center);

  const nearestPathology = sortedCenters.find(
    (p) => String(p._id) !== String(pathology._id)
  );

  if (!nearestPathology) {
    const superadmins = await adminSchema.find({ role: "superadmin" });

    await Promise.all(
      superadmins.map(async (admin) => {
        const notify = new notificationModel({
          title: "Manual Delivery Partner Assignment Required",
          message: `No delivery partner available for order ${order._id}`,
          recipientType: "admin",
          notificationType: "manual_delivery_assignment",
          NotificationTypeId: order._id,
          recipientId: admin._id,
        });

        if (admin.deviceToken) {
          await sendExpoNotification(
            [admin.deviceToken],
            "Manual Assignment Needed",
            notify.message,
            notify
          );
        }

        await notify.save();
      })
    );

    await order.save();
    return successRes(res, 200, true, "No nearest center found. Admin notified.", order);
  }

  // Avoid duplicate attempt
  const alreadyAttempted = order.pathologyAttempts.some(
    (p) => String(p.pathologyCenterId) === String(nearestPathology._id)
  );

  if (!alreadyAttempted) {
    order.pathologyCenterId = nearestPathology._id;
    order.status = "pending";
    order.pathologyAttempts.push({
      pathologyCenterId: nearestPathology._id,
      status: "pending",
      attemptedAt: new Date(),
    });

    const notification = new notificationModel({
      title: "New Order",
      message: "You have a new order",
      recipientType: "pathology",
      notificationType: "pathology_order_request",
      NotificationTypeId: order._id,
      recipientId: nearestPathology._id,
    });

    if (nearestPathology.deviceToken) {
      await sendExpoNotification(
        [nearestPathology.deviceToken],
        "New Order",
        notification.message,
        notification
      );
    }

    await Promise.all([order.save(), notification.save()]);
  } else {
    await order.save(); // Just save the rejected attempt
  }

  return successRes(res, 200, true, "Order status updated successfully", order);
});

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



