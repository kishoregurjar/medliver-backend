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
const Pharmacy = require("../../modals/pharmacy.model")


module.exports.getAllAssignedOrder = asyncErrorHandler(async (req, res, next) => {
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
                status: "pending"
            }
        }
    });

    return successRes(res, 200, true, "Orders fetched successfully", orders);
});

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

    const findPharmacy = await pharmacyModel.findById(pharmacyId);
    if (!findPharmacy) return next(new CustomError("Pharmacy not found", 404));
    const pharmacyCoordinates = findPharmacy.pharmacyCoordinates;

    if (!pharmacyCoordinates?.lat || !pharmacyCoordinates?.long) {
        return next(new CustomError("Pharmacy coordinates are not available", 400));
    }

    // Push pharmacy attempt
    order.pharmacyAttempts.push({
        pharmacyId,
        status,
        attemptedAt: new Date()
    });

    // ---------------- ACCEPT ----------------
    if (status === "accepted") {
        order.pharmacyResponseStatus = "accepted";
        order.orderStatus = "accepted_by_pharmacy";
        order.assignedPharmacyCoordinates = pharmacyCoordinates;

        // Clear pharmacyQueue
        order.pharmacyQueue = [];

        const availablePartners = await DeliveryPartner.find({
            availabilityStatus: "available",
            isBlocked: false,
            deviceToken: { $ne: null },
            "location.lat": { $ne: null },
            "location.long": { $ne: null }
        });

        console.log(availablePartners, "availablePartners")

        const sortedPartners = availablePartners
            .map(dp => ({
                ...dp._doc,
                distance: getDistance(pharmacyCoordinates, dp.location)
            }))
            .sort((a, b) => a.distance - b.distance);

        if (sortedPartners.length > 0) {
            const nearestPartner = sortedPartners[0];
            order.deliveryPartnerId = nearestPartner._id;
            order.deliveryPartnerAttempts.push({
                deliveryPartnerId: nearestPartner._id,
                status: "pending",
                attemptedAt: new Date()
            });

            order.deliveryPartnerQueue.push(nearestPartner._id);

            const newNotification = new notificationModel({
                title: "New Pickup Order",
                message: "You have a new pickup order request",
                recipientType: "delivery_partner",
                notificationType: "delivery_partner_pickup_request",
                NotificationTypeId: order._id,
                recipientId: nearestPartner._id
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
            console.log(admins, "admins")
            for (let admin of admins) {
                const notify = new notificationModel({
                    title: "Manual Delivery Partner Assignment Required",
                    message: `No delivery partner available for order ${order._id}`,
                    recipientType: "admin",
                    notificationType: "manual_delivery_assignment",
                    NotificationTypeId: order._id,
                    recipientId: admin._id
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
        }


        await order.save();
        return successRes(res, 200, true, "Order accepted successfully", order);
    }

    // ---------------- REJECT ----------------
    order.pharmacyResponseStatus = "rejected";
    order.assignedPharmacyId = null;

    // Remove from pharmacyQueue
    order.pharmacyQueue = order.pharmacyQueue.filter(id => id.toString() !== pharmacyId);

    const attemptedPharmacyIds = order.pharmacyAttempts.map(a => a.pharmacyId.toString());

    // STEP 1: Check in pharmacyQueue who has not yet attempted
    let nextPharmacy = null;
    for (let id of order.pharmacyQueue) {
        if (!attemptedPharmacyIds.includes(id.toString())) {
            nextPharmacy = await pharmacyModel.findById(id);
            break;
        }
    }

    // STEP 2: If none found in queue, find fresh pharmacies
    if (!nextPharmacy) {
        const customerCoords = order.deliveryAddress.coordinates;

        const remainingPharmacies = await pharmacyModel.find({
            _id: { $nin: attemptedPharmacyIds },
            "location.coordinates": { $exists: true }
        });

        const sortedPharmacies = remainingPharmacies
            .map(pharmacy => ({
                ...pharmacy._doc,
                distance: getDistance(customerCoords, pharmacy.location.coordinates)
            }))
            .sort((a, b) => a.distance - b.distance);

        if (sortedPharmacies.length > 0) {
            nextPharmacy = sortedPharmacies[0];
        }
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
                recipientId: admin._id
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
                orderType: order.orderType
            }
        );
    }
    return successRes(res, 200, true, "Order rejected and reassigned to another pharmacy", order);
});
module.exports.getAcceptedOrdersByPharmacy = asyncErrorHandler(async (req, res) => {
  const admin = req.admin;

  const pharmacy = await Pharmacy.findOne({ adminId: admin._id });

  if (!pharmacy) {
    return errorRes(res, 404, false, "Pharmacy not found");
  }

  console.log("pharmacy Id", pharmacy._id);

  const acceptedOrders = await ordersModel.find(
    {
      assignedPharmacyId: pharmacy._id,
      pharmacyResponseStatus: "accepted"
    },
    {
      _id: 1,
      orderDate: 1,
      customerId: 1,
      items: 1,
      totalAmount: 1,
      paymentMethod: 1,
      paymentStatus: 1,
      orderStatus: 1,
      prescriptionRequired: 1,
      "deliveryAddress.deliveryAddressId": 1,
      assignedPharmacyId: 1,
      pharmacyResponseStatus: 1,
      pharmacyAttempts: 1
    }
  ).sort({ orderDate: -1 });

  return successRes(res, 200, true, "Accepted orders fetched", acceptedOrders);
});
