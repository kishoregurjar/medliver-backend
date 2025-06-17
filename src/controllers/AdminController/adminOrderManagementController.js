const ordersModel = require("../../modals/orders.model");
const pharmacyModel = require("../../modals/pharmacy.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const { sendExpoNotification } = require("../../utils/expoNotification");
const { getDistance } = require("../../utils/helper");
const notificationModel = require("../../modals/notification.model");
const deliveryModel = require("../../modals/delivery.model");
const sendFirebaseNotification = require("../../services/sendNotification");
const notificationEnum = require("../../services/notificationEnum");


module.exports.getAllManualOrderAssignment = asyncErrorHandler(async (req, res, next) => {
    let { assignment_for } = req.query;
    if (!assignment_for) {
        return next(new CustomError("Assignment For is required", 400));
    }
    let orderStatus = assignment_for === "pharmacy" ? "need_manual_assignment_to_pharmacy" : "need_manual_assignment_to_delivery_partner";
    let orders = await ordersModel.find({ orderStatus }).populate('customerId' ,'fullName');
    return successRes(res, 200, true, "Orders fetched successfully", orders);
});

module.exports.getNearByPharmacyToCustomer = asyncErrorHandler(async (req, res, next) => {
    let { orderId } = req.query;

    if (!orderId) {
        return next(new CustomError("Order ID is required", 400));
    }

    let order = await ordersModel.findById(orderId).select('deliveryAddress orderStatus');
    if (!order) {
        return next(new CustomError("Order not found", 404));
    }

    if (order.orderStatus !== "need_manual_assignment_to_pharmacy") {
        return next(new CustomError("This order cannot be assigned manually to a pharmacy", 400));
    }

    const nearbyPharmacies = await pharmacyModel.find({
        deviceToken: { $ne: null },
        pharmacyCoordinates: { $ne: null },
        availabilityStatus: "available",
        status: 'active'
    });

    const sortedPharmaciesWithDistance = await Promise.all(
        nearbyPharmacies.map(async (pharmacy) => {
            const distance = await getDistance(order.deliveryAddress.coordinates, pharmacy.pharmacyCoordinates);
            return {
                ...pharmacy.toObject(),
                distanceInKm: parseFloat(distance.toFixed(2))
            };
        })
    );

    sortedPharmaciesWithDistance.sort((a, b) => a.distanceInKm - b.distanceInKm);


    return successRes(res, 200, true, "Pharmacies fetched successfully", sortedPharmaciesWithDistance);
});

module.exports.manuallyAssignOrderToPhramacy = asyncErrorHandler(async (req, res, next) => {
    let { pharmacyId, orderId } = req.body;

    if (!pharmacyId || !orderId) {
        return next(new CustomError("Pharmacy ID and Order ID are required", 400));
    }

    let order = await ordersModel.findById(orderId);
    if (!order) {
        return next(new CustomError("Order not found", 404));
    }

    if (order.orderStatus !== "need_manual_assignment_to_pharmacy") {
        return next(new CustomError("This order cannot be assigned manually to a pharmacy", 400));
    }

    let findPharmacy = await pharmacyModel.findById(pharmacyId);
    if (!findPharmacy) {
        return next(new CustomError("Pharmacy not found", 404));
    }
    if (findPharmacy.availabilityStatus !== "available") {
        return next(new CustomError("Pharmacy is not online", 400));
    }
    if (findPharmacy.status !== 'active') {
        return next(new CustomError("Pharmacy is not active", 400));
    }
    if (!findPharmacy.pharmacyCoordinates?.lat || !findPharmacy.pharmacyCoordinates?.long) {
        return next(new CustomError("Pharmacy coordinates are not available", 400));
    }
    if (!findPharmacy.deviceToken) {
        return next(new CustomError("Pharmacy device token is not available", 400));
    }
    let pharmacyDeviceToken = findPharmacy.deviceToken;
    // Assign pharmacy and update status
    order.assignedPharmacyId = pharmacyId;
    order.orderStatus = "assigned_to_pharmacy";

    // Push to pharmacyAttempts
    order.pharmacyAttempts.push({
        pharmacyId: pharmacyId,
        status: "pending", // can later be updated by pharmacy
        attemptedAt: new Date()
    });
    let notificationType = "pharmacy_order_request";
    let role = 'pharmacy';
    let notificiationRes = notificationEnum.getNotification(role, notificationType);
    // Create and send notification
    let newNotification = new notificationModel({
        title: notificiationRes.title,
        message: notificiationRes.message,
        recipientType: "pharmacy",
        notificationType: notificationType,
        NotificationTypeId: order._id,
        recipientId: pharmacyId
    });

    await newNotification.save();

    await sendFirebaseNotification(
        pharmacyDeviceToken,
        notificiationRes.title,
        notificiationRes.message,
        newNotification
    );

    await order.save();

    return successRes(res, 200, true, "Order assigned to pharmacy successfully", order);
});

module.exports.getNearyByDeliveryToPharmacy = asyncErrorHandler(async (req, res, next) => {
    let { orderId } = req.query;

    if (!orderId) {
        return next(new CustomError("Order ID is required", 400));
    }

    let order = await ordersModel.findById(orderId).select('assignedPharmacyId orderStatus deliveryAddress');
    if (!order) {
        return next(new CustomError("Order not found", 404));
    }
    if (order.orderStatus !== "need_manual_assignment_to_delivery_partner") {
        return next(new CustomError("This order cannot be assigned manually to a delivery partner", 400));
    }



    const nearByDeliveryPartners = await deliveryModel.find({
        deviceToken: { $ne: null },
        location: { $ne: null },
        availabilityStatus: "available",
        isBlocked: false,
        isVerified: true,
        approvalStatus: "approved"
    });

    const sortedPartnerWithDistance = await Promise.all(
        nearByDeliveryPartners.map(async (partner) => {
            const distance = await getDistance(order.deliveryAddress.coordinates, partner.location);
            return {
                ...partner.toObject(),
                distanceInKm: parseFloat(distance.toFixed(2))
            };
        })
    );

    sortedPartnerWithDistance.sort((a, b) => a.distanceInKm - b.distanceInKm);


    return successRes(res, 200, true, "Delivery Partners fetched successfully", sortedPartnerWithDistance);

});

module.exports.manuallyAssignOrderToDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    let { deliveryPartnerId, orderId } = req.body;

    if (!deliveryPartnerId || !orderId) {
        return next(new CustomError("Delivery Partner ID and Order ID are required", 400));
    }

    let order = await ordersModel.findById(orderId);
    if (!order) {
        return next(new CustomError("Order not found", 404));
    }

    if (order.orderStatus !== "need_manual_assignment_to_delivery_partner") {
        return next(new CustomError("This order cannot be assigned manually to a delivery partner", 400));
    }

    let findDeliveryPartner = await deliveryModel.findById(deliveryPartnerId);
    if (!findDeliveryPartner) {
        return next(new CustomError("Delivery Partner not found", 404));
    }
    if (findDeliveryPartner.availabilityStatus !== "available") {
        return next(new CustomError("Delivery Partner is not online", 400));
    }
    if (findDeliveryPartner.status !== 'active') {
        return next(new CustomError("Delivery Partner is not active", 400));
    }
    if (!findDeliveryPartner.location?.lat || !findDeliveryPartner.location?.long) {
        return next(new CustomError("Delivery Partner location is not available", 400));
    }
    if (!findDeliveryPartner.deviceToken) {
        return next(new CustomError("Delivery Partner device token is not available", 400));
    }
    let deliveryPartnerDeviceToken = findDeliveryPartner.deviceToken;
    // Assign pharmacy and update status
    order.assignedDeliveryPartnerId = deliveryPartnerId;
    order.orderStatus = "assigned_to_delivery_partner";

    // Push to pharmacyAttempts
    order.deliveryPartnerAttempts.push({
        deliveryPartnerId: deliveryPartnerId,
        status: "pending", // can later be updated by pharmacy
        attemptedAt: new Date()
    });

    // Create and send notification
    let newNotification = new notificationModel({
        title: "New Order",
        message: "You have a new order",
        recipientType: "delivery_partner",
        notificationType: "delivery_partner_order_request",
        NotificationTypeId: order._id,
        recipientId: deliveryPartnerDeviceToken
    });

    await newNotification.save();

    await sendExpoNotification(
        [deliveryPartnerDeviceToken],
        "New Order",
        "You have a new order",
        newNotification
    );

    await order.save();

    return successRes(res, 200, true, "Order assigned to delivery partner successfully", order);
});


