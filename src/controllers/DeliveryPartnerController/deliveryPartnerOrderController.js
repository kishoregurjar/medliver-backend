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
const { deliveryOrderStatus } = require("../../utils/helper");
const { generateOTPNumber } = require("../../services/helper");
const { pickupOrderMail } = require("../../services/sendMail");
const Razorpay = require("razorpay");
const moment = require("moment");
const notificationEnum = require("../../services/notificationEnum");
const sendFirebaseNotification = require("../../services/sendNotification");
const deliveryRateModel = require("../../modals/deliveryRate.model");
const deliveryPartnerPaymentModel = require("../../modals/deliveryPartnerPayment.model");




module.exports.getRequestedOrder = asyncErrorHandler(async (req, res, next) => {
  const deliveryPartnerId = req.partner._id;
  let { orderStatus } = req.query;
  const orders = await ordersModel
    .find({ deliveryPartnerId: deliveryPartnerId, orderStatus: orderStatus })
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
      " -pharmacyQueue -deliveryPartnerQueue -pharmacyResponseStatus -pharmacyAttempts -deliveryPartnerAttempts"
    )
    .populate(
      "assignedPharmacyId",
      "pharmacyName address phone completeAddress"
    )
    .populate("customerId", "fullName phoneNumber profilePicture");

  console.log(order.orderStatus, "order.orderStatus");
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

  if (order.orderStatus === "accepted_by_delivery_partner" || order.orderStatus === "out_for_delivery" || order.orderStatus === "delivered" || order.orderStatus == "picked-up") {
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
      const route = await getRouteBetweenCoords(
        pharmacyCoordinates,
        partner.location
      );
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
      console.log(customer.deviceToken, "customer.deviceToken");
      const result = await sendExpoNotification(
        [customer.deviceToken],
        "Order Accepted",
        "Your Order has been accepted by delivery partner",
        notification
      );
      console.log(result, "result");
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

    const nearestPartner = sortedPartners.find(
      (p) => String(p._id) !== String(deliveryPartnerId)
    );

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

      const adminNotifications = await Promise.all(
        admins.map(async (admin) => {
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
        })
      );

      await order.save();
    }

    return successRes(res, 200, true, "Order rejected and reassigned", order);
  }

  return next(new CustomError("Invalid status", 400));
});

module.exports.updateDeliveryStatus = asyncErrorHandler(
  async (req, res, next) => {
    const { orderStatus, orderId } = req.body;
    const partnerId = req.partner._id;

    if (!orderId || !orderStatus) {
      return next(new CustomError("Order ID and status are required", 400));
    }
    if (!deliveryOrderStatus.includes(orderStatus)) {
      return next(new CustomError("Invalid order status", 400));
    }
    const order = await ordersModel.findOne({
      _id: orderId,
      deliveryPartnerId: partnerId,
    });

    if (!order) return next(new CustomError("Order not found", 404));
    order.orderStatus = orderStatus;
    await order.save();
    return successRes(
      res,
      200,
      true,
      "Order status updated successfully",
      { orderStatus: order.orderStatus }
    );
  }
);

module.exports.reachedPharmacy = asyncErrorHandler(async (req, res, next) => {
  const deliveryPartnerId = req.partner._id;
  const { orderId } = req.body;

  if (!orderId) {
    return next(new CustomError("Order ID is required", 400));
  }

  // Fetch both order and delivery partner details in parallel
  const [order, deliveryPartner] = await Promise.all([
    ordersModel.findOne({ _id: orderId, deliveryPartnerId }),
    DeliveryPartner.findById(deliveryPartnerId),
  ]);

  if (!order) {
    return next(new CustomError("Order not found", 404));
  }

  if (!deliveryPartner) {
    return next(new CustomError("Delivery partner not found", 404));
  }

  if (order.orderStatus !== "accepted_by_delivery_partner") {
    return next(new CustomError("Order is not accepted by delivery partner", 400));
  }

  let findPharmacy = await pharmacyModel.findOne({ _id: order.assignedPharmacyId }).select("deviceToken");
  console.log(findPharmacy, "findPharmacy");
  let pharmacyDeviceToken = findPharmacy.deviceToken;

  const otp = generateOTPNumber(4);
  order.orderStatus = "reached_pharmacy";
  order.deliveryPartnerOTP = otp;
  // Pass full details to the mail function
  pickupOrderMail(
    deliveryPartner.email,
    deliveryPartner.fullname, otp, order._id);
  let notificationType = "delivery_partner_reached_pharmacy";
  let notificationRes = notificationEnum.getNotification("pharmacy", notificationType);

  let newNotification = new notificationModel({
    title: notificationRes.title,
    message: notificationRes.message,
    recipientType: "pharmacy",
    notificationType: notificationType,
    NotificationTypeId: order._id,
    recipientId: order.assignedPharmacyId
  });


  // await newNotification.save();

  await sendFirebaseNotification(
    pharmacyDeviceToken,
    notificationRes.title,
    notificationRes.message,
    newNotification
  )

  // await order.save();

  return successRes(res, 200, true, "Delivery partner reached pharmacy successfully", order);
});

module.exports.reachedDestination = asyncErrorHandler(async (req, res, next) => {
  const deliveryPartnerId = req.partner._id;
  const { orderId } = req.body;

  if (!orderId) {
    return next(new CustomError("Order ID is required", 400));
  }

  // Fetch both order and delivery partner details in parallel
  const [order, deliveryPartner] = await Promise.all([
    ordersModel.findOne({ _id: orderId, deliveryPartnerId }),
    DeliveryPartner.findById(deliveryPartnerId),
  ]);

  if (!order) {
    return next(new CustomError("Order not found", 404));
  }

  if (order.orderStatus !== "accepted_by_delivery_partner") {
    return next(new CustomError("Order is not accepted by delivery partner", 400));
  }

  if (!deliveryPartner) {
    return next(new CustomError("Delivery partner not found", 404));
  }

  let customerOtp = generateOTPNumber(4);
  order.customerOTP = customerOtp;
  order.orderStatus = "reached_destination";
  order.status = "reached_destination";

  await order.save();

  return successRes(res, 200, true, "Delivery partner reached destination successfully", order);
});

module.exports.verifyCustomerOtp = asyncErrorHandler(async (req, res, next) => {
  const deliveryPartnerId = req.partner._id;
  const { orderId, otp } = req.body;

  if (!orderId) {
    return next(new CustomError("Order ID is required", 400));
  }

  // Fetch both order and delivery partner details in parallel
  const [order, deliveryPartner] = await Promise.all([
    ordersModel.findOne({ _id: orderId, deliveryPartnerId }),
    DeliveryPartner.findById(deliveryPartnerId),
  ]);

  if (!order) {
    return next(new CustomError("Order not found", 404));
  }

  if (!deliveryPartner) {
    return next(new CustomError("Delivery partner not found", 404));
  }

  if (order.orderStatus !== "reached_destination") {
    return next(new CustomError("Order is not reached destination", 400));
  }

  if (order.customerOTP !== otp) {
    return next(new CustomError("Invalid OTP", 400));
  }
  order.orderStatus = "verified_by_customer";
  order.customerOTP = null;
  await order.save();

  let response = {
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    orderStatus: order.orderStatus,
    orderid: order._id,
  }

  return successRes(res, 200, true, "Delivery partner verified successfully", response);
});

module.exports.generateUPIQRCode = asyncErrorHandler(async (req, res, next) => {
  const deliveryPartnerId = req.partner._id;
  const { orderId } = req.body;

  if (!orderId) {
    return next(new CustomError("Order ID is required", 400));
  }

  const [order, deliveryPartner] = await Promise.all([
    ordersModel.findOne({ _id: orderId, deliveryPartnerId }),
    DeliveryPartner.findById(deliveryPartnerId),
  ]);

  if (!order) return next(new CustomError("Order not found", 404));
  if (!deliveryPartner) return next(new CustomError("Delivery partner not found", 404));

  if (order.orderStatus !== "verified_by_customer") {
    return next(new CustomError("Order is not verified by customer", 400));
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  // Calculate expiry time (e.g., 15 minutes from now)
  const closeBy = moment().add(15, 'minutes').unix();

  const qrPayload = {
    type: "upi_qr",
    name: `Order ${order._id}`,
    usage: "single_use",
    fixed_amount: true,
    payment_amount: Math.round(order.totalAmount * 100), // Amount in paise
    description: `Payment for Order ${order._id}`,
    close_by: closeBy,
    notes: {
      purpose: "Medicine Delivery Payment",
      deliveryPartnerId: deliveryPartnerId.toString(),
    }
  };

  // Optional: If you have a saved Razorpay customer_id for the user
  // if (order.customerRazorpayId) {
  //   qrPayload.customer_id = order.customerRazorpayId;
  // }

  const qrResponse = await razorpay.qrCode.create(qrPayload);

  // You can store this QR code ID in the order if needed
  // order.qrCodeId = qrResponse.id;
  // await order.save();

  return successRes(res, 200, true, "UPI QR Code generated successfully", {
    qrCodeId: qrResponse.id,
    image_url: qrResponse.image_url,
    payload: qrResponse, // Optional full payload
  });
});

module.exports.deliverOrder = asyncErrorHandler(async (req, res, next) => {
  const deliveryPartnerId = req.partner._id;
  const { orderId, otp } = req.body;

  if (!orderId) return next(new CustomError("Order ID is required", 400));

  const [order, deliveryPartner] = await Promise.all([
    ordersModel.findOne({ _id: orderId, deliveryPartnerId }),
    DeliveryPartner.findById(deliveryPartnerId),
  ]);

  if (!order) return next(new CustomError("Order not found", 404));
  if (!deliveryPartner) return next(new CustomError("Delivery partner not found", 404));
  if (order.orderStatus !== "reached_destination") {
    return next(new CustomError("Order is not at destination", 400));
  }
  if (order.customerOTP !== otp) return next(new CustomError("Invalid OTP", 400));

  if (order.paymentStatus !== "paid") return next(new CustomError("Order is not paid", 400));

  const routeData = order.pharmacyToCustomerRoute?.[0];
  const distanceStr = routeData?.distance || "0 km";
  const numericDistance = parseFloat(distanceStr); // e.g. "4.8 km" -> 4.8

  const deliveryRate = await deliveryRateModel
    .findOne({ is_active: true })
    .select("per_km_price");

  const ratePerKm = deliveryRate?.per_km_price || 10;
  const amount = parseFloat((numericDistance * ratePerKm).toFixed(2));

  const deliveryPartnerPayment = await deliveryPartnerPaymentModel.create({
    deliveryPartnerId,
    orderId: order._id.toString(),
    amount,
    distanceInKm: numericDistance,
    pharmacyCoordinates: {
      lat: order.assignedPharmacyCoordinates?.lat,
      lng: order.assignedPharmacyCoordinates?.long,
    },
    userCoordinates: {
      lat: order.deliveryAddress?.coordinates?.lat,
      lng: order.deliveryAddress?.coordinates?.long,
    },
    paymentStatus: "pending",
    remarks: "Auto-added on delivery confirmation",
  });

  order.orderStatus = "delivered";
  order.status = "delivered";
  order.deliveryPartnerPaymentId = deliveryPartnerPayment._id;

  await order.save();

  return successRes(res, 200, true, "Order delivered and payment recorded", deliveryPartnerPayment);
});
