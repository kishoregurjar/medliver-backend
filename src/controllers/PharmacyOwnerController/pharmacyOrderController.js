const ordersModel = require("../../modals/orders.model");
const pharmacyModel = require("../../modals/pharmacy.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const DeliveryPartner = require("../../modals/delivery.model");
const CustomError = require("../../utils/customError");
const { sendExpoNotification } = require("../../utils/expoNotification");
const { getDistance } = require("../../utils/helper");
const notificationModel = require("../../modals/notification.model");


module.exports.getAllAssignedOrder = asyncErrorHandler(async (req, res, next) => {
    const adminId = req.admin._id;
    const findPharmacy = await pharmacyModel.findOne({ adminId });

    if (!findPharmacy) {
        return next(new CustomError("Pharmacy not found", 404));
    }

    const pharmacyId = findPharmacy._id;
    const orders = await ordersModel.find({
        pharmacyAttempts: {
            $elemMatch: {
                pharmacyId: pharmacyId,
                status: "pending"
            }
        }
    });

    return successRes(res, 200, true, "Orders fetched successfully", orders);
});

module.exports.acceptOrRejectOrder = asyncErrorHandler(async (req, res, next) => {
    const { orderId, pharmacyId, status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
        return next(new CustomError("Invalid status", 400));
    }

    const order = await ordersModel.findById(orderId);
    if (!order) return next(new CustomError("Order not found", 404));
    console.log(order, "orer")
    if (order.orderStatus === "accepted") {
        return next(new CustomError("Order already accepted", 400));
    }

    if (order.assignedPharmacyId?.toString() !== pharmacyId) {
        return next(new CustomError("This pharmacy is not assigned to this order", 403));
    }

    let findPharmacy = await pharmacyModel.findById(pharmacyId);
    if (!findPharmacy) return next(new CustomError("Pharmacy not found", 404));
    let pharmacyCoordinates = findPharmacy.pharmacyCoordinates;

    // Log pharmacy attempt
    order.pharmacyAttempts.push({
        pharmacyId,
        status,
        attemptedAt: new Date()
    });

    if (status === "accepted") {
        order.pharmacyResponseStatus = "accepted";
        order.orderStatus = "confirmed";
        order.assignedPharmacyCoordinates = pharmacyCoordinates;

        const availablePartners = await DeliveryPartner.find({
            availabilityStatus: "available",
            isBlocked: false,
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
            order.orderStatus = "assigned";

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


