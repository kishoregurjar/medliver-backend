const ordersModel = require("../../modals/orders.model");
const pharmacyModel = require("../../modals/pharmacy.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const DeliveryPartner = require("../../modals/delivery.model");
const CustomError = require("../../utils/customError");
const { sendExpoNotification } = require("../../utils/expoNotification");
const { getDistance } = require("../../utils/helper");
const notificationModel = require("../../modals/notification.model");
const adminSchema = require("../../modals/admin.Schema");
const Pharmacy = require("../../modals/pharmacy.model");
const { getRouteBetweenCoords } = require("../../utils/distance.helper");

module.exports.getAllAssignedOrder = asyncErrorHandler(
  async (req, res, next) => {
    const adminId = req.admin._id;
    const findPharmacy = await pharmacyModel.findOne({ adminId });

    if (!findPharmacy) {
      return next(new CustomError("Pharmacy not found", 404));
    }

    const pharmacyId = findPharmacy._id;
    const orders = await ordersModel.find({
      pharmacyResponseStatus: "pending",
      pharmacyAttempts: {
        $elemMatch: {
          pharmacyId: pharmacyId,
          status: "pending",
        },
      },
    });

    return successRes(res, 200, true, "Orders fetched successfully", orders);
  }
);

/**
module.exports.acceptOrRejectOrder = asyncErrorHandler(async (req, res, next) => {
    const { orderId, pharmacyId, status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
        return next(new CustomError("Invalid status", 400));
    }

    const order = await ordersModel.findById(orderId);
    if (!order) return next(new CustomError("Order not found", 404));
    if (status === "accepted" && order.orderStatus === "accepted_by_pharmacy") {
        return next(new CustomError("Order already accepted", 400));
    }
    if (status === "rejected" && order.orderStatus === "accepted_by_pharmacy") {
        return next(new CustomError("Order already accepted. Cannot reject now", 400));
    }

    if (order.assignedPharmacyId?.toString() !== pharmacyId) {
        return next(new CustomError("This pharmacy is not assigned to this order", 403));
    }

    let findPharmacy = await pharmacyModel.findById(pharmacyId);
    if (!findPharmacy) return next(new CustomError("Pharmacy not found", 404));
    let pharmacyCoordinates = findPharmacy.pharmacyCoordinates;

    if (!findPharmacy.pharmacyCoordinates?.lat || !findPharmacy.pharmacyCoordinates?.long) {
        return next(new CustomError("Pharmacy coordinates are not available", 400));
    }

    // Log pharmacy attempt
    order.pharmacyAttempts.push({
        pharmacyId,
        status,
        attemptedAt: new Date()
    });

    if (status === "accepted") {
        order.pharmacyResponseStatus = "accepted";
        order.orderStatus = "accepted";
        order.assignedPharmacyCoordinates = pharmacyCoordinates;

        const availablePartners = await DeliveryPartner.find({
            availabilityStatus: "available",
            isBlocked: false,
            deviceToken: { $ne: null },
            "location.lat": { $ne: null },
            "location.long": { $ne: null }
        });
        const sortedPartners = availablePartners
            .map(dp => ({
                ...dp._doc,
                distance: getDistance(order.assignedPharmacyCoordinates, dp.location)
            }))
            .sort((a, b) => a.distance - b.distance);

        if (sortedPartners.length > 0) {
            const nearestPartner = sortedPartners[0];
            order.deliveryPartnerId = nearestPartner._id;
            // order.orderStatus = "assigned";

            order.deliveryPartnerAttempts.push({
                deliveryPartnerId: nearestPartner._id,
                status: "pending",
                attemptedAt: new Date()
            });
            // Send notification to delivery partner

            let newNotification = new notificationModel({
                title: "New Pickup Order",
                message: "You have a new pickup order request",
                recipientType: "delivery_partner",
                notificationType: "pickup_request",
                NotificationTypeId: order._id,
                recipientId: nearestPartner._id
            });

            await newNotification.save();
            console.log(nearestPartner, "nearestPartner.deviceToken")
            if (nearestPartner.deviceToken) {
                await sendExpoNotification(
                    [nearestPartner.deviceToken],
                    "New Delivery Request",
                    "You have a new delivery request",
                    newNotification
                );
            }

        }

        await order.save();

        return successRes(res, 200, true, "Order accepted successfully", order);
    }

    // If rejected
    order.pharmacyResponseStatus = "rejected";
    order.assignedPharmacyId = null;
    order.pharmacyQueue = order.pharmacyQueue.filter(id => id.toString() !== pharmacyId);

    const attemptedPharmacyIds = order.pharmacyAttempts.map(a => a.pharmacyId.toString());
    const customerCoords = order.deliveryAddress.coordinates;

    const remainingPharmacies = await pharmacyModel.find({
        _id: { $nin: attemptedPharmacyIds },
        location: { $exists: true }
    });

    const sortedPharmacies = remainingPharmacies
        .map(pharmacy => ({
            ...pharmacy._doc,
            distance: getDistance(customerCoords, pharmacy.location.coordinates)
        }))
        .sort((a, b) => a.distance - b.distance);

    if (sortedPharmacies.length === 0) {
        await order.save();
        return res.status(200).json({
            success: true,
            message: "No more pharmacies available to assign",
        });
    }

    const nextPharmacy = sortedPharmacies[0];

    order.assignedPharmacyId = nextPharmacy._id;
    order.pharmacyResponseStatus = "pending";
    order.pharmacyQueue.push(nextPharmacy._id);

    await order.save();

    if (nextPharmacy.deviceToken) {
        await sendExpoNotification(
            [nextPharmacy.deviceToken],
            "New Order Request",
            "You have a new pharmacy order request",
            {
                path: "PharmacyOrderScreen",
                orderId: order._id,
                medicineName: order.items[0]?.medicineName || "Order",
                orderType: order.orderType
            }
        );
    }

    return res.status(200).json({
        success: true,
        message: "Order rejected and reassigned to another pharmacy",
    });
});
 */

module.exports.acceptOrRejectOrder = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;
  const { orderId, status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    return next(new CustomError("Invalid status", 400));
  }

  const pharmacy = await pharmacyModel.findOne({ adminId }).select("_id pharmacyCoordinates pharmacyAddress");
  if (!pharmacy) return next(new CustomError("Pharmacy not found", 404));

  const pharmacyId = pharmacy._id.toString();

  if (!pharmacy.pharmacyCoordinates?.lat || !pharmacy.pharmacyCoordinates?.long) {
    return next(new CustomError("Pharmacy coordinates are not available", 400));
  }

  const order = await ordersModel.findById(orderId);
  if (!order) return next(new CustomError("Order not found", 404));

  if (order.assignedPharmacyId?.toString() !== pharmacyId) {
    return next(new CustomError("This pharmacy is not assigned to this order", 403));
  }

  if (status === "accepted" && (order.orderStatus === "accepted_by_pharmacy" || order.orderStatus === "assigned_to_delivery_partner" || order.orderStatus === "accepted_by_delivery_partner" || order.orderStatus === "need_manual_assignment_to_delivery_partner")) {
    return next(new CustomError("Order already accepted", 400));
  }

  if (status === "rejected" && order.orderStatus === "accepted_by_pharmacy") {
    return next(new CustomError("Order already accepted. Cannot reject now", 400));
  }

  // Log pharmacy attempt
  order.pharmacyAttempts.push({
    pharmacyId,
    status,
    attemptedAt: new Date(),
  });

  // ---------------- ACCEPT ----------------
  if (status === "accepted") {
    order.pharmacyResponseStatus = "accepted";
    order.orderStatus = "accepted_by_pharmacy";
    order.assignedPharmacyCoordinates = pharmacy.pharmacyCoordinates;
    order.pharmacyQueue = [];
    order.pickupAddress = pharmacy.pharmacyAddress;
    if (order.deliveryAddress?.coordinates) {
      const route = await getRouteBetweenCoords(
        pharmacy.pharmacyCoordinates,
        order.deliveryAddress.coordinates
      );
      if (route) order.pharmacyToCustomerRoute = route;
    }

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
        distance: getDistance(pharmacy.pharmacyCoordinates, dp.location),
      }))
      .sort((a, b) => a.distance - b.distance);

    if (sortedPartners.length > 0) {
      const nearest = sortedPartners[0];

      order.deliveryPartnerId = nearest._id;
      order.deliveryPartnerQueue.push(nearest._id);
      order.deliveryPartnerAttempts.push({
        deliveryPartnerId: nearest._id,
        status: "pending",
        attemptedAt: new Date(),
      });

      const notification = new notificationModel({
        title: "New Pickup Order",
        message: "You have a new pickup order request",
        recipientType: "delivery_partner",
        notificationType: "delivery_partner_pickup_request",
        NotificationTypeId: order._id,
        recipientId: nearest._id,
      });

      await notification.save();

      if (nearest.deviceToken) {
        await sendExpoNotification(
          [nearest.deviceToken],
          "New Delivery Request",
          "You have a new delivery request",
          notification
        );
      }
      order.orderStatus = "assigned_to_delivery_partner";
    } else {
      const admin = await adminSchema.findOne({ role: "superadmin" });

      if (admin) {
        const notify = new notificationModel({
          title: "Manual Delivery Partner Assignment Required",
          message: `No delivery partner available for order ${order._id}`,
          recipientType: "admin",
          notificationType: "manual_delivery_assignment",
          NotificationTypeId: order._id,
          recipientId: admin._id,
        });
        await notify.save();

        if (admin.deviceToken) {
          await sendExpoNotification(
            [admin.deviceToken],
            "Manual Assignment Needed",
            "No delivery partner available for order",
            notify
          );
        }
      }

      order.orderStatus = "need_manual_assignment_to_delivery_partner";
    }

    await order.save();
    return successRes(res, 200, true, "Order accepted successfully", order);
  }

  // ---------------- REJECT ----------------
  order.pharmacyResponseStatus = "rejected";
  order.assignedPharmacyId = null;
  order.pharmacyQueue = order.pharmacyQueue.filter(
    (id) => id.toString() !== pharmacyId
  );

  const attemptedIds = new Set(order.pharmacyAttempts.map((a) => a.pharmacyId.toString()));

  // STEP 1: Reassign to next in queue who hasn't attempted
  let nextPharmacy = null;

  for (let id of order.pharmacyQueue) {
    if (!attemptedIds.has(id.toString())) {
      nextPharmacy = await pharmacyModel.findById(id).select("_id deviceToken");
      break;
    }
  }

  // STEP 2: Fresh search if none in queue
  if (!nextPharmacy) {
    const customerCoords = order.deliveryAddress?.coordinates;
    const remainingPharmacies = await pharmacyModel.find({
      _id: { $nin: [...attemptedIds] },
      "location.coordinates": { $exists: true },
    });

    const sorted = remainingPharmacies
      .map((p) => ({
        ...p._doc,
        distance: getDistance(customerCoords, p.location.coordinates),
      }))
      .sort((a, b) => a.distance - b.distance);

    if (sorted.length > 0) nextPharmacy = sorted[0];
  }

  if (!nextPharmacy) {
    await order.save();

    const admins = await adminSchema.find({ role: "superadmin" });

    for (let admin of admins) {
      const notify = new notificationModel({
        title: "Manual Pharmacy Assignment Required",
        message: `No pharmacy available for order ${order._id}`,
        recipientType: "admin",
        notificationType: "manual_pharmacy_assignment",
        NotificationTypeId: order._id,
        recipientId: admin._id,
      });
      await notify.save();
    }

    return successRes(res, 200, true, "Order rejected.", order);
  }

  // Assign to next pharmacy
  order.assignedPharmacyId = nextPharmacy._id;
  order.pharmacyResponseStatus = "pending";
  order.pharmacyQueue.push(nextPharmacy._id);

  await order.save();

  if (nextPharmacy.deviceToken) {
    await sendExpoNotification(
      [nextPharmacy.deviceToken],
      "New Order Request",
      "You have a new pharmacy order request",
      {
        path: "PharmacyOrderScreen",
        orderId: order._id,
        medicineName: order.items[0]?.medicineName || "Order",
        orderType: order.orderType,
      }
    );
  }

  return successRes(
    res,
    200,
    true,
    "Order rejected and reassigned to another pharmacy",
    order
  );
});


// module.exports.getAcceptedOrdersByPharmacy = asyncErrorHandler(
//   async (req, res) => {
//     const admin = req.admin;

//     const pharmacy = await Pharmacy.findOne({ adminId: admin._id });

//     if (!pharmacy) {
//       return errorRes(res, 404, false, "Pharmacy not found");
//     }

//     const acceptedOrders = await ordersModel
//       .find(
//         {
//           assignedPharmacyId: pharmacy._id,
//           pharmacyResponseStatus: "accepted",
//         },
//         {
//           _id: 1,
//           orderDate: 1,
//           customerId: 1,
//           deliveryPartnerId: 1,
//           items: 1,
//           totalAmount: 1,
//           paymentMethod: 1,
//           paymentStatus: 1,
//           "deliveryAddress.deliveryAddressId": 1,
//           assignedPharmacyId: 1,
//           orderStatus:1,
//           pharmacyResponseStatus:1
//         }
//       )
//       .populate({
//         path: "customerId",
//         select: "fullName email phoneNumber",
//       })
//       .populate({
//         path: "deliveryPartnerId",
//         select: "fullname email location phone",
//       })
//       .sort({ orderDate: -1 });

//     return successRes(
//       res,
//       200,
//       true,
//       "Accepted orders fetched",
//       acceptedOrders
//     );
//   }
// );

module.exports.getAcceptedOrdersByPharmacy = asyncErrorHandler(
  async (req, res) => {
    let {page,limit} = req.query;
    const admin = req.admin;

    const pharmacy = await Pharmacy.findOne({ adminId: admin._id });

    if (!pharmacy) {
      return errorRes(res, 404, false, "Pharmacy not found");
    }

     page = parseInt(page) || 1;
     limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const totalOrders = await ordersModel.countDocuments({
      assignedPharmacyId: pharmacy._id,
      pharmacyResponseStatus: "accepted",
    });

    const acceptedOrders = await ordersModel
      .find(
        {
          assignedPharmacyId: pharmacy._id,
          pharmacyResponseStatus: "accepted",
        },
        {
          _id: 1,
          orderDate: 1,
          customerId: 1,
          deliveryPartnerId: 1,
          items: 1,
          totalAmount: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          "deliveryAddress.deliveryAddressId": 1,
          assignedPharmacyId: 1,
          orderStatus: 1,
          pharmacyResponseStatus: 1,
        }
      )
      .populate({
        path: "customerId",
        select: "fullName email phoneNumber",
      })
      .populate({
        path: "deliveryPartnerId",
        select: "fullname email location phone",
      })
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    return successRes(res, 200, true, "Accepted orders fetched", {
      results: acceptedOrders,
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
     
    });
  }
);


module.exports.searchPharmacyOrder = asyncErrorHandler(async (req, res, next) => {
  let { value, page, limit } = req.query;

  if (!value) {
    return next(new CustomError("Search value is required", 400));
  }

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const regex = new RegExp(value.trim(), "i");

  const searchQuery = {
    orderType: "pharmacy",
    $or: [
      { orderStatus: regex },
      { paymentStatus: regex },
      { paymentMethod: regex },
      { pharmacyResponseStatus: regex },
    ],
  };

  const [totalOrders, allOrders] = await Promise.all([
    ordersModel.countDocuments(searchQuery),
    ordersModel.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  if (allOrders.length === 0) {
    return successRes(res, 200, false, "No pharmacy orders found", []);
  }

  return successRes(res, 200, true, "Pharmacy orders fetched successfully", {
    orders: allOrders,
    currentPage: page,
    totalPages: Math.ceil(totalOrders / limit),
    totalOrders,
  });
});

module.exports.dispatchOrder = asyncErrorHandler(async (req, res, next) => {
  const { orderId, otp } = req.body;

  const order = await ordersModel.findById(orderId);
  if (!order) return next(new CustomError("Order not found", 404));

  if (order.deliveryPartnerOTP !== otp) return next(new CustomError("Invalid OTP", 400));

  order.orderStatus = "out_for_delivery";

  await order.save();

  let newNotification = new notificationModel({
    title: "Order Assigned",
    message: "A pharmacy has handed over the order. Please proceed to deliver it.",
    recipientType: "delivery_partner",
    notificationType: "delivery_partner_received_order",
    NotificationTypeId: order._id,
    recipientId: order.deliveryPartnerId
  });

  await newNotification.save();

  await sendExpoNotification(
    [order.deliveryPartnerDeviceToken],
    "New Order Assigned",
    "A new order has been dispatched to you by the pharmacy.",
    newNotification
  );


  return successRes(res, 200, true, "Order dispatched successfully", order);
});

module.exports.getAllDetailsOfOrdersById = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;
  const orderId = req.query.orderId;

  const pharmacy = await pharmacyModel.findOne({ adminId });
  if (!pharmacy) return next(new CustomError("Pharmacy not found", 404));

  const order = await ordersModel.findOne({
    _id: orderId,
    orderType: { $in: ["pharmacy", "mixed"] },
    $or: [
      { assignedPharmacyId: pharmacy._id },
      { pharmacyAttempts: { $elemMatch: { pharmacyId: pharmacy._id, status: { $in: ["pending", "accepted"] } } } }
    ]
  })
  .populate("customerId", "fullName phoneNumber email")
  .populate("assignedPharmacyId", "pharmacyName phone address")
  .populate("deliveryPartnerId", "phone location fullname email")  // only name here
  .populate("deliveryAddressId", "street city state pincode coordinates")
  .populate("items.medicineId", "medicineName category")
  .populate("pharmacyQueue", "pharmacyName")
  .populate("deliveryPartnerQueue", "name")
  .populate("pharmacyAttempts.pharmacyId", "pharmacyName")
  .populate("deliveryPartnerAttempts.deliveryPartnerId", "name");

  if (!order) return next(new CustomError("Order not found or not assigned to this pharmacy", 404));

  return successRes(res, 200, true, "Order details fetched successfully", order);
});
