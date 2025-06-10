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
const PrescriptionSchema = require("../../modals/pescriptionSchema");
const stockModel = require("../../modals/stock.model");
const { default: mongoose } = require("mongoose");

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

module.exports.getAcceptedOrdersByPharmacy = asyncErrorHandler(
  async (req, res) => {
    let { page, limit } = req.query;
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

module.exports.getAssignedPrescriptionOrder = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;

  const pharmacy = await pharmacyModel.findOne({ adminId });
  console.log("pharmacy", pharmacy);
  if (!pharmacy) return next(new CustomError("Pharmacy not found", 404));

  const prescriptionOrders = await PrescriptionSchema.find({ assigned_pharmacy: pharmacy._id, status: "assigned_to_pharmacy" }).populate("user_id", "fullName phoneNumber email").populate("assigned_pharmacy", "pharmacyName phone address pharmacyCoordinates").populate("addressId", "street city state pincode location");

  return successRes(res, 200, true, "Prescription orders fetched successfully", prescriptionOrders);
});

module.exports.acceptOrRejectPrecription = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;
  const { orderId, status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    return next(new CustomError("Invalid status", 400));
  }

  const pharmacy = await pharmacyModel.findOne({ adminId }).select("_id pharmacyCoordinates pharmacyAddress deviceToken");
  if (!pharmacy) return next(new CustomError("Pharmacy not found", 404));

  if (!pharmacy.pharmacyCoordinates?.lat || !pharmacy.pharmacyCoordinates?.long) {
    return next(new CustomError("Pharmacy coordinates are not available", 400));
  }

  const order = await PrescriptionSchema.findOne({ _id: orderId, assigned_pharmacy: pharmacy._id });
  if (!order) return next(new CustomError("Order not found", 404));

  if (order.status === "accepted_by_pharmacy") {
    return next(new CustomError("Order already accepted", 400));
  }

  if (order.status === "rejected_by_pharmacy") {
    return next(new CustomError("Order already rejected", 400));
  }
  // ---------------- ACCEPT ----------------
  if (status === "accepted" && order.status === "assigned_to_pharmacy") {
    order.status = "accepted_by_pharmacy";
    order.pickupAddress = pharmacy.pharmacyAddress;
    order.assignedPharmacyCoordinates = pharmacy.pharmacyCoordinates;
    order.pharmacyAttempts.push({
      pharmacyId: pharmacy._id,
      status: "accepted",
      attemptAt: new Date(),
    })
    if (order.deliveryAddress?.coordinates) {
      console.log(pharmacy.pharmacyCoordinates, order.deliveryAddress.coordinates);
      const route = await getRouteBetweenCoords(
        pharmacy.pharmacyCoordinates,
        order.deliveryAddress.coordinates
      );
      if (route) order.pharmacyToCustomerRoute = route;
    }

    const deliveryPartners = await DeliveryPartner.find({
      availabilityStatus: "available",
      isBlocked: false,
      deviceToken: { $ne: null },
      "location.lat": { $ne: null },
      "location.long": { $ne: null },
    });

    const sortedPartners = deliveryPartners
      .map((dp) => ({
        ...dp._doc,
        distance: getDistance(pharmacy.pharmacyCoordinates, dp.location),
      }))
      .sort((a, b) => a.distance - b.distance);

    if (sortedPartners.length > 0) {
      const nearestPartner = sortedPartners[0];

      order.assigned_delivery_partner = nearestPartner._id;
      order.status = "assigned_to_delivery_partner";
      order.deliveryPartnerAttempts.push({
        deliveryPartnerId: nearestPartner._id,
        status: "pending",
        attemptedAt: new Date(),
      })

      const notify = new notificationModel({
        title: "New Pickup Order",
        message: "You have a new pickup request",
        recipientType: "delivery_partner",
        notificationType: "delivery_partner_pickup_request",
        NotificationTypeId: order._id,
        recipientId: nearestPartner._id,
      });

      await notify.save();

      if (nearestPartner.deviceToken) {
        await sendExpoNotification(
          [nearestPartner.deviceToken],
          "New Pickup Request",
          "You have a new pickup request",
          notify
        );
      }
    } else {
      const admin = await adminSchema.findOne({ role: "superadmin" });
      if (admin) {
        const notify = new notificationModel({
          title: "Manual Delivery Assignment Needed",
          message: `No delivery partner available for prescription ${order._id}`,
          recipientType: "admin",
          notificationType: "manual_delivery_assignment",
          NotificationTypeId: order._id,
          recipientId: admin._id,
        });
        // await notify.save();

        if (admin.deviceToken) {
          await sendExpoNotification(
            [admin.deviceToken],
            "Manual Delivery Assignment",
            "No delivery partner available. Manual assignment required.",
            notify
          );
        }

        order.status = "need_manual_assignment_to_delivery_partner";
      }
    }

    await order.save();
    return successRes(res, 200, true, "Prescription accepted successfully", order);
  }

  // ---------------- REJECT ----------------
  if (status === "rejected" && order.status === "assigned_to_pharmacy") {
    order.status = "pending";
    order.assigned_pharmacy = null;
    order.pharmacyAttempts.push({
      pharmacyId: pharmacy._id,
      status: "rejected",
      attemptAt: new Date(),
    })

    // Reassign to next pharmacy if available
    const alreadyAttempted = await PrescriptionSchema.distinct("assigned_pharmacy", {
      _id: order._id,
      "pharmacyAttempts.status": "rejected"
    });

    const customerCoords = order.deliveryAddress?.coordinates;

    const availablePharmacies = await pharmacyModel.find({
      _id: { $nin: [...alreadyAttempted, pharmacy._id] },
      pharmacyCoordinates: { $ne: null },
      deviceToken: { $ne: null },
      status: "active",
    });

    const sorted = availablePharmacies
      .map((p) => ({
        ...p._doc,
        distance: getDistance(customerCoords, p.pharmacyCoordinates),
      }))
      .sort((a, b) => a.distance - b.distance);

    if (sorted.length > 0) {
      const nextPharmacy = sorted[0];
      order.assigned_pharmacy = nextPharmacy._id;
      order.status = "assigned_to_pharmacy";

      if (nextPharmacy.deviceToken) {
        await sendExpoNotification(
          [nextPharmacy.deviceToken],
          "New Prescription Request",
          "You have a new prescription request",
          {
            path: "PharmacyOrderScreen",
            orderId: order._id,
          }
        );
      }
    } else {
      // Notify admin if no pharmacies available
      const admins = await adminSchema.find({ role: "superadmin" });

      order.status = "need_manual_assignment_to_pharmacy";

      for (let admin of admins) {
        const notify = new notificationModel({
          title: "Manual Pharmacy Assignment Required",
          message: `No pharmacy available for prescription ${order._id}`,
          recipientType: "admin",
          notificationType: "manual_pharmacy_assignment",
          NotificationTypeId: order._id,
          recipientId: admin._id,
        });
        await notify.save();

        if (admin.deviceToken) {
          await sendExpoNotification(
            [admin.deviceToken],
            "Manual Assignment Required",
            "No pharmacy available for this prescription",
            notify
          );
        }
      }
    }

    await order.save();
    return successRes(res, 200, true, "Prescription rejected", order);
  }

  return next(new CustomError("Invalid order status or transition", 400));
});

// module.exports.searchPrescriptionsByStatus = asyncErrorHandler(async (req, res, next) => {
//   let { query, page, limit, status } = req.query;

//   if (!query) {
//     return next(new CustomError("Search value is required", 400));
//   }

//   const regex = new RegExp(query.trim(), "i");
//   page = parseInt(page) || 1;
//   limit = parseInt(limit) || 10;
//   const skip = (page - 1) * limit;

//   const pharmacy = await pharmacyModel.findOne({ adminId: req.admin._id });
//   if (!pharmacy) {
//     return errorRes(res, 404, false, "Pharmacy not found");
//   }

//   const prescriptions = await PrescriptionSchema.find({
//     pharmacyAttempts: {
//       $elemMatch: {
//         pharmacyId: pharmacy._id,
//         ...(status && { status }),
//       },
//     },
//   })
//     .populate({
//       path: "user_id",
//       select: "fullName email"
//     })
//     .sort({ created_at: -1 })
//     .lean();

//   const filteredPrescriptions = prescriptions.filter((p) => {
//     const customerName = p.user_id?.fullName || "";
//     return (
//       regex.test(p.prescriptionNumber || "") ||
//       regex.test(customerName)
//     );
//   });

//   const totalResults = filteredPrescriptions.length;
//   const paginatedResults = filteredPrescriptions.slice(skip, skip + limit);

//   if (paginatedResults.length === 0) {
//     return successRes(res, 200, false, "No prescriptions found", []);
//   }

//   return successRes(res, 200, true, "Prescriptions fetched successfully", {
//     prescriptions: paginatedResults,
//     totalResults,
//     currentPage: page,
//     totalPages: Math.ceil(totalResults / limit),
//   });
// });
module.exports.searchPrescriptionsByStatus = asyncErrorHandler(async (req, res, next) => {
  let { query, page, limit, status } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // Check: At least one filter must be present
  if (!query && !status) {
    return next(new CustomError("Please provide either a search query or a status", 400));
  }

  const pharmacy = await pharmacyModel.findOne({ adminId: req.admin._id });
  if (!pharmacy) {
    return errorRes(res, 404, false, "Pharmacy not found");
  }

  // Base filter by pharmacy
  const baseFilter = {
    pharmacyAttempts: {
      $elemMatch: {
        pharmacyId: pharmacy._id,
        ...(status && { status }),
      },
    },
  };

  const prescriptions = await PrescriptionSchema.find(baseFilter)
    .populate({
      path: "user_id",
      select: "fullName email"
    })
    .sort({ created_at: -1 })
    .lean();

  // Apply search filter if query is provided
  const filteredPrescriptions = query
    ? prescriptions.filter((p) => {
        const regex = new RegExp(query.trim(), "i");
        const customerName = p.user_id?.fullName || "";
        return (
          regex.test(p.prescriptionNumber || "") ||
          regex.test(customerName)
        );
      })
    : prescriptions;

  const totalResults = filteredPrescriptions.length;
  const paginatedResults = filteredPrescriptions.slice(skip, skip + limit);

  if (paginatedResults.length === 0) {
    return successRes(res, 200, false, "No prescriptions found", []);
  }

  return successRes(res, 200, true, "Prescriptions fetched successfully", {
    prescriptions: paginatedResults,
    totalResults,
    currentPage: page,
    totalPages: Math.ceil(totalResults / limit),
  });
});

module.exports.searchOrdersByStatus = asyncErrorHandler(async (req, res, next) => {
  let { query, page, limit, status } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // Build base filter
  let baseFilter = {};

  // Filter by status if provided
  if (status && ["pending", "accepted"].includes(status)) {
    baseFilter.pharmacyAttempts = {
      $elemMatch: { status }
    };
  }

  const orders = await ordersModel.find(baseFilter)
    .populate({
      path: "customerId",
      select: "fullName email"
    })
    .sort({ createdAt: -1 })
    .lean();

  // If neither query nor status is given, return error
  if (!query && !status) {
    return next(new CustomError("Please provide either a search query or a status", 400));
  }

  // If query is provided, filter orders by orderNumber or customer name
  const filteredOrders = query
    ? orders.filter((order) => {
        const regex = new RegExp(query.trim(), "i");
        const customerName = order.customerId?.fullName || "";
        return (
          regex.test(order.orderNumber || "") ||
          regex.test(customerName)
        );
      })
    : orders;

  const totalResults = filteredOrders.length;
  const paginatedResults = filteredOrders.slice(skip, skip + limit);

  if (paginatedResults.length === 0) {
    return successRes(res, 200, false, "No orders found", []);
  }

  return successRes(res, 200, true, "Orders fetched successfully", {
    orders: paginatedResults,
    totalResults,
    currentPage: page,
    totalPages: Math.ceil(totalResults / limit),
  });
});

module.exports.createInvoiceForPrescription = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;
  const {orderId, medicines, total_amount, discounted_amount } = req.body;

  const pharmacies = await pharmacyModel.findOne({ adminId });
  if (!pharmacies) {
    return next(new CustomError("Pharmacy not found", 404));
  }

  const order = await PrescriptionSchema.findOne({ _id: orderId, assigned_pharmacy: pharmacies._id });
  if (!order) return next(new CustomError("Order not found", 404));

  const unavailableMedicines = [];

  for (let med of medicines) {
    const stock = await stockModel.findOne({
      pharmacyId: pharmacies._id,
      medicineId: med.medicineId
    });
    if (!stock || stock.quantity < med.quantity) {
      unavailableMedicines.push(med.medicineId);
    }
  }

  if (unavailableMedicines.length > 0) {
    return next(new CustomError(`Stock not available for medicines: ${unavailableMedicines.join(", ")}`, 400));
    
  }

  order.total_amount = total_amount;
  order.discounted_amount = discounted_amount;
  order.medicines = medicines;

  await order.save();

  return successRes(res, 200, true, "Invoice created successfully", order);
});
