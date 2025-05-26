const orderPathologyModel = require('../../models/orderPathologyModel');
const CustomError = require('../../utils/customError');
const asyncErrorHandler = require('../../utils/asyncErrorHandler');
const customerAddressModel = require('../../modals/customerAddress.model');
const pathologySchema = require('../../modals/pathology.model');

module.exports.createPathologyOrder = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { test_ids, deliveryAddressId, paymentMethod } = req.body;

  if (!test_ids || !Array.isArray(test_ids) || test_ids.length === 0) {
    return next(new CustomError("Test IDs are required", 400));
  }


  let totalAmount = 0;
  let isHomeCollection = false;
  const selectedTests = test_ids;

  const findAddress = await customerAddressModel.findOne({
    customer_id: userId,
    _id: deliveryAddressId,
  });

  if (!findAddress) {
    return next(new CustomError("Delivery address not found", 404));
  }

  const allCenters = await pathologySchema.find({
    status: "active",
    availabilityStatus: "available",
    deviceToken: { $ne: null },
    centerCoordinates: { $ne: null },
    availableTests: { $elemMatch: { testId: { $in: test_ids } } },
  });

  const userCoords = findAddress.location;
  const sortedCenters = allCenters
    .map((center) => ({
      center,
      distance: getDistance(userCoords, center.centerCoordinates),
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.center);

  const assignedCenter = sortedCenters[0] || null;

  const newOrder = new pathologyOrderSchema({
    customerId: userId,
    pathologyCenterId: assignedCenter?._id || null,
    selectedTests,
    totalAmount,
    isHomeCollection,
    deliveryAddress: {
      street: findAddress?.street,
      city: findAddress?.city,
      state: findAddress?.state,
      pincode: findAddress?.pincode,
      coordinates: {
        lat: findAddress?.location?.lat,
        long: findAddress?.location?.long,
      },
    },
  });

  await newOrder.save();

  // Update cart
  const updatedItems = cart.items.filter(
    (item) => !test_ids.includes(item.item_id.toString())
  );
  cart.items = updatedItems;
  cart.total_price = updatedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  await cart.save();

  // Notify pathology center or admin
  let notification;

  if (assignedCenter) {
    notification = new notificationModel({
      title: "New Pathology Order",
      message: "You have a new test booking",
      recipientId: assignedCenter._id,
      recipientType: "pathology",
      NotificationTypeId: newOrder._id,
      notificationType: "pathology_order_request",
    });
    await sendExpoNotification(
      [assignedCenter.deviceToken],
      "New Test Booking",
      "You have a new pathology test booking",
      notification
    );
  } else {
    const admins = await adminSchema.find({ role: "superadmin" });
    for (const admin of admins) {
      notification = new notificationModel({
        title: "Manual Pathology Assignment",
        message: "No pathology center available. Manual assignment required.",
        recipientId: admin._id,
        recipientType: "admin",
        NotificationTypeId: newOrder._id,
        notificationType: "manual_pathology_assignment",
      });
      await sendExpoNotification(
        [admin.deviceToken],
        "Manual Assignment Needed",
        "No pathology center available",
        notification
      );
    }
  }

  if (notification) await notification.save();

  return successRes(res, 201, true, "Pathology order placed successfully", {
    pathologyOrder: newOrder,
    notification,
    assignedTo: assignedCenter ? "pathology center" : "admin",
  });
});
