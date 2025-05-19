const notificationModel = require("../../modals/notification.model");
const ordersModel = require("../../modals/orders.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const { sendExpoNotification } = require("../../utils/expoNotification");
const { getDistance } = require("../../utils/helper");
const DeliveryPartner = require("../../modals/delivery.model");
const customerModel = require("../../modals/customer.model");

module.exports.getRequestedOrder = asyncErrorHandler(async (req, res, next) => {
  const deliveryPartnerId = req.partner._id;
  const orders = await ordersModel
    .find({ deliveryPartnerId: deliveryPartnerId })
    .populate("assignedPharmacyId");
  return successRes(res, 200, true, "Orders fetched successfully", orders);
});

module.exports.getOrderById = asyncErrorHandler(async (req, res, next) => {
  const deliveryPartnerId = req.partner._id;
  console.log("deliveryPartnerId", deliveryPartnerId);
  let { orderId } = req.query;
  if (!orderId) {
    return next(new CustomError("Order ID is required", 400));
  }
  const order = await ordersModel
    .findOne({ _id: orderId, deliveryPartnerId: deliveryPartnerId })
    .select(
      "-orderStatus -pharmacyQueue -deliveryPartnerQueue -pharmacyResponseStatus -pharmacyAttempts -deliveryPartnerAttempts"
    )
    .populate(
      "assignedPharmacyId",
      "pharmacyName address phone completeAddress"
    )
    .populate("customerId", "fullName phoneNumber profilePicture");
  if (!order) {
    return next(new CustomError("Order not found", 404));
  }
  return successRes(res, 200, true, "Order fetched successfully", order);
});

module.exports.acceptRejectOrder = asyncErrorHandler(async (req, res, next) => {
  const deliveryPartnerId = req.partner._id;
  let { orderId, status } = req.body;
  if (!orderId) {
    return next(new CustomError("Order ID is required", 400));
  }
  const order = await ordersModel.findOne({
    _id: orderId,
    deliveryPartnerId: deliveryPartnerId,
  });
  if (!order) {
    return next(new CustomError("Order not found", 404));
  }
  if (order.orderStatus === "accepted_by_delivery_partner") {
    return next(new CustomError("Order already accepted", 400));
  }

  const findPartner = await DeliveryPartner.findById(deliveryPartnerId);
  if (!findPartner) {
    return next(new CustomError("Delivery Partner not found", 404));
  }

  const findCutomer  = await customerModel.findById(order.customerId);
  if (!findCutomer) {
    return next(new CustomError("Customer not found", 404));
  }

  if (status == "accepted") {
    order.orderStatus = "accepted_by_delivery_partner";
    // order.deliveryPartnerId = deliveryPartnerId;
    order.deliveryPartnerAttempts.push({
      deliveryPartnerId: deliveryPartnerId,
      status: "accepted",
    });

    const pharmacyCoordinates = order.pickupAddress;
    
  

    if (pharmacyCoordinates && findPartner.location) {
        let pharmacyToDeliveryRoute = await getRouteBetweenCoords(
          pharmacyCoordinates,
          findPartner.location
        );
        if (pharmacyToDeliveryRoute)
          order.pharmacyToDeliveryPartnerRoute = pharmacyToDeliveryRoute;
        await order.save();
      }

      const newNotification = new notificationModel({
        title: "Order Accepted",
        message: "Your Order has been accepted by delivery partner",
        recipientType: "customer",
        notificationType: "pickup_request",
        NotificationTypeId: order._id,
        recipientId: findCutomer._id,
      });

      await newNotification.save();

      if (findCutomer.deviceToken) {
        await sendExpoNotification(
          [findCutomer.deviceToken],
          "Order Accepted",
          "Your Order has been accepted by delivery partner",
          newNotification
        );
      }


    await order.save();
    return successRes(res, 200, true, "Order accepted successfully", order);
  } else if (status == "rejected") {
    order.deliveryPartnerAttempts.push({
      deliveryPartnerId: deliveryPartnerId,
      status: "rejected",
    });

    await order.save();
    const availablePartners = await DeliveryPartner.find({
      availabilityStatus: "available",
      isBlocked: false,
      deviceToken: { $ne: null },
      "location.lat": { $ne: null },
      "location.long": { $ne: null },
    });
    const sortedPartners = availablePartners
      .map((dp) => ({
        ...dp._doc,
        distance: getDistance(pharmacyCoordinates, dp.location),
      }))
      .sort((a, b) => a.distance - b.distance);

    if (
      sortedPartners.length > 0 &&
      sortedPartners[0]._id != deliveryPartnerId
    ) {
      const nearestPartner = sortedPartners[0];
      order.deliveryPartnerId = nearestPartner._id;
      order.deliveryPartnerAttempts.push({
        deliveryPartnerId: nearestPartner._id,
        status: "pending",
        attemptedAt: new Date(),
      });

      order.deliveryPartnerQueue.push(nearestPartner._id);

      const newNotification = new notificationModel({
        title: "New Pickup Order",
        message: "You have a new pickup order request",
        recipientType: "delivery_partner",
        notificationType: "pickup_request",
        NotificationTypeId: order._id,
        recipientId: nearestPartner._id,
      });

      await newNotification.save();

      if (nearestPartner.deviceToken) {
        await sendExpoNotification(
          [nearestPartner.deviceToken],
          "New Delivery Request",
          "You have a new delivery request",
          newNotification
        );
      }
    } else {
      // No delivery partner available → notify admin
      const admins = await adminSchema.find({ role: "superadmin" });
      console.log(admins, "admins");
      for (let admin of admins) {
        const notify = new notificationModel({
          title: "Manual Delivery Partner Assignment Required",
          message: `No delivery partner available for order ${order._id}`,
          recipientType: "admin",
          notificationType: "manual_delivery_assignment",
          NotificationTypeId: order._id,
          recipientId: admin._id,
        });
        // await notify.save();
        if (admin.deviceToken) {
          await sendExpoNotification(
            [admin.deviceToken],
            "Manual Assignment Needed",
            "No delivery partner available for order",
            notify
          );
        }
      }
    }
  } else {
    return next(new CustomError("Invalid status", 400));
  }
  order.orderStatus = orderStatus;
  await order.save();
  return successRes(res, 200, true, "Order status updated successfully", order);
});
