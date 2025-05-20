const notificationModel = require("../../modals/notification.model");
const ordersModel = require("../../modals/orders.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const { sendExpoNotification } = require("../../utils/expoNotification");
const { getDistance } = require("../../utils/helper");
const DeliveryPartner = require("../../modals/delivery.model");
const customerModel = require("../../modals/customer.model");
const pharmacyModel = require("../../modals/pharmacy.model");
const { getRouteBetweenCoords } = require("../../utils/distance.helper");
const adminSchema = require("../../modals/admin.Schema");

module.exports.getRequestedOrder = asyncErrorHandler(async (req, res, next) => {
  const deliveryPartnerId = req.partner._id;
  let { orderStatus } = req.query;
  const orders = await ordersModel
    .find({ deliveryPartnerId: deliveryPartnerId , orderStatus: orderStatus })
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
    const { orderId, status } = req.body;
  
    if (!orderId) return next(new CustomError("Order ID is required", 400));
  
    const order = await ordersModel.findOne({
      _id: orderId,
      deliveryPartnerId,
    });
    if (!order) return next(new CustomError("Order not found", 404));
  
    if (order.orderStatus === "accepted_by_delivery_partner") {
      return next(new CustomError("Order already accepted", 400));
    }
  
    const [partner, customer, pharmacy] = await Promise.all([
      DeliveryPartner.findById(deliveryPartnerId),
      customerModel.findById(order.customerId),
      pharmacyModel.findById(order.assignedPharmacyId),
    ]);
  
    if (!partner) return next(new CustomError("Delivery Partner not found", 404));
    if (!customer) return next(new CustomError("Customer not found", 404));
    if (!pharmacy) return next(new CustomError("Pharmacy not found", 404));
  
    const pharmacyCoordinates = pharmacy.pharmacyCoordinates;
  
    if (status === "accepted") {
      order.orderStatus = "accepted_by_delivery_partner";
      order.deliveryPartnerAttempts.push({
        deliveryPartnerId,
        status: "accepted",
      });
  
      partner.availabilityStatus = "on-delivery";
      if (pharmacyCoordinates && partner.location) {
        const route = await getRouteBetweenCoords(pharmacyCoordinates, partner.location);
        if (route) order.pharmacyToDeliveryPartnerRoute = route;
      }
  
      const notification = new notificationModel({
        title: "Order Accepted",
        message: "Your Order has been accepted by delivery partner",
        recipientType: "customer",
        notificationType: "delivery_partner_order_accepted",
        NotificationTypeId: order._id,
        recipientId: customer._id,
      });

    //   console.log(customer.deviceToken,"customer.deviceToken");
  
      if (customer.deviceToken) {
        console.log(customer.deviceToken,"customer.deviceToken");
       const result = await sendExpoNotification(
          [customer.deviceToken],
          "Order Accepted",
          "Your Order has been accepted by delivery partner",
          notification
        );
        console.log(result,"result");
      }
      await Promise.all([order.save(), notification.save(), partner.save()]);
      return successRes(res, 200, true, "Order accepted successfully", order);
    }
  
    if (status === "rejected") {
      order.deliveryPartnerAttempts.push({
        deliveryPartnerId,
        status: "rejected",
      });
  
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
  
      const nearestPartner = sortedPartners.find(p => String(p._id) !== String(deliveryPartnerId));
  
      if (nearestPartner) {
        order.deliveryPartnerId = nearestPartner._id;
        order.deliveryPartnerAttempts.push({
          deliveryPartnerId: nearestPartner._id,
          status: "pending",
          attemptedAt: new Date(),
        });
        order.deliveryPartnerQueue.push(nearestPartner._id);
  
        const notification = new notificationModel({
          title: "New Pickup Order",
          message: "You have a new pickup order request",
          recipientType: "delivery_partner",
          notificationType: "pickup_request",
          NotificationTypeId: order._id,
          recipientId: nearestPartner._id,
        });
  
        if (nearestPartner.deviceToken) {
          await sendExpoNotification(
            [nearestPartner.deviceToken],
            "New Delivery Request",
            "You have a new delivery request",
            notification
          );
        }
  
        await Promise.all([order.save(), notification.save()]);
      } else {
        const admins = await adminSchema.find({ role: "superadmin" });
  
        const adminNotifications = await Promise.all(admins.map(async (admin) => {
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
              "No delivery partner available for order",
              notify
            );
          }
  
          return notify.save();
        }));
  
        await order.save();
      }
  
      return successRes(res, 200, true, "Order rejected and reassigned", order);
    }
  
    return next(new CustomError("Invalid status", 400));
  });
  