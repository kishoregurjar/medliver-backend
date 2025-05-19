const orderSchema = require("../../modals/orders.model");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const cartSchema = require("../../modals/cart.model");
const { successRes } = require("../../services/response");
const medicineModel = require("../../modals/medicine.model");
const pescriptionSchema = require("../../modals/pescriptionSchema");
const customerAddressModel = require("../../modals/customerAddress.model");
const { sendExpoNotification } = require("../../utils/expoNotification");
const pharmacySchema = require("../../modals/pharmacy.model");
const notificationModel = require("../../modals/notification.model");
const { getDistance } = require("../../utils/helper");
const adminSchema = require("../../modals/admin.Schema");
const getRouteBetweenCoords = require("../../utils/distance.helper");

module.exports.createOrder = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { item_ids, deliveryAddressId, paymentMethod } = req.body;

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
        return next(new CustomError("Item IDs are required", 400));
    }

    const cart = await cartSchema.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0) {
        return next(new CustomError("Cart is empty or not found", 404));
    }

    const itemsToOrder = cart.items.filter(item => item_ids.includes(item.item_id.toString()));
    if (itemsToOrder.length === 0) {
        return next(new CustomError("No valid items found in the cart for the provided item IDs", 404));
    }

    let totalPrice = 0;
    let prescriptionRequired = false;
    let isTestHomeCollection = false;
    const orderItems = [];

    for (const item of itemsToOrder) {
        totalPrice += item.price * item.quantity;

        if (item.item_type === "medicine") {
            const medicine = await medicineModel.findById(item.item_id);
            if (medicine?.isPrescriptionRequired) prescriptionRequired = true;
            orderItems.push({ medicineId: item.item_id, quantity: item.quantity, price: item.price, medicineName: item.name });
        } else if (item.item_type === "test") {
            if (item.details?.available_at_home) isTestHomeCollection = true;
            orderItems.push({ testName: item.name, quantity: item.quantity, price: item.price });
        }
    }

    const hasMedicine = itemsToOrder.some(i => i.item_type === "Medicine");
    const hasTest = itemsToOrder.some(i => i.item_type === "test");
    const orderType = hasMedicine && hasTest ? "mixed" : hasMedicine ? "pharmacy" : hasTest ? "pathology" : null;

    if (!orderType) return next(new CustomError("Invalid items in cart", 400));

    const findAddress = await customerAddressModel.findOne({
        customer_id: userId,
        _id: deliveryAddressId
    });

    if (!findAddress) {
        return next(new CustomError("Delivery address not found", 404));
    }

    const allPharmacies = await pharmacySchema.find({
        status: "active",
        availabilityStatus: "available",
        deviceToken: { $ne: null },
        pharmacyCoordinates: { $ne: null }
    });

    const userCoords = findAddress.location;
    const sortedPharmacies = allPharmacies
        .map(pharmacy => ({
            pharmacy,
            distance: getDistance(userCoords, pharmacy.pharmacyCoordinates)
        }))
        .sort((a, b) => a.distance - b.distance)
        .map(entry => entry.pharmacy);

    const pharmacyQueue = sortedPharmacies.map(p => p._id);
    const assignedPharmacy = sortedPharmacies[0] || null;

    const pharmacyAttempts = assignedPharmacy ? [{
        pharmacyId: assignedPharmacy._id,
        status: "pending",
        attemptAt: new Date(),
    }] : [];

    const newOrder = new orderSchema({
        customerId: userId,
        orderType,
        items: orderItems,
        totalAmount: totalPrice,
        deliveryAddressId,
        paymentMethod,
        prescriptionRequired,
        isTestHomeCollection,
        assignedPharmacyId: assignedPharmacy?._id || null,
        pharmacyQueue,
        pharmacyAttempts,
        deliveryAddress: {
            street: findAddress?.street,
            city: findAddress?.city,
            state: findAddress?.state,
            pincode: findAddress?.pincode,
            coordinates: {
                lat: findAddress?.location?.lat,
                long: findAddress?.location?.long
            }
        }
    });

    await newOrder.save();

    // Update cart
    const updatedItems = cart.items.filter(item => !item_ids.includes(item.item_id.toString()));
    cart.items = updatedItems;
    cart.total_price = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    await cart.save();

    // Notify pharmacy or admin
    let notification;

    if (assignedPharmacy) {
        notification = new notificationModel({
            title: "New Order",
            message: "You have a new order",
            recipientId: assignedPharmacy._id,
            recipientType: "pharmacy",
            NotificationTypeId: newOrder._id,
            notificationType: "pharmacy_order_request",
        });
        await sendExpoNotification([assignedPharmacy.deviceToken], "New Order", "You have a new order", notification);
        if (assignedPharmacy.pharmacyCoordinates && findAddress.location) {

            let pharmacyToCustomerRoute = await getRouteBetweenCoords(assignedPharmacy.pharmacyCoordinates, findAddress.location);
            if (pharmacyToCustomerRoute) newOrder.pharmacyToCustomerRoute = pharmacyToCustomerRoute;
            newOrder.save();
        }
    } else {
        // No pharmacy found — notify admin for manual assignment
        const admins = await adminSchema.find({ role: 'superadmin' });
        for (const admin of admins) {
            notification = new notificationModel({
                title: "Manual Order Assignment",
                message: "No pharmacy available for new order. Manual assignment required.",
                recipientId: admin._id,
                recipientType: "admin",
                NotificationTypeId: newOrder._id,
                notificationType: "manual_pharmacy_assignment",
            });
            newOrder.orderStatus = "need_manual_assignment_to_pharmacy";
            console.log(newOrder, "newOrder")
            await newOrder.save();
            await sendExpoNotification([admin.deviceToken], "Manual Assignment Needed", "No pharmacy available for order", notification);
        }
    }

    if (notification) await notification.save();

    return successRes(res, 201, true, "Order placed successfully", {
        order: newOrder,
        notification,
        assignedTo: assignedPharmacy ? "pharmacy" : "admin"
    });
});

module.exports.getAllOrders = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    const orders = await orderSchema.find({ customerId: userId }).populate("items.medicineId").populate("deliveryAddressId").sort({ createdAt: -1 });
    if (!orders || orders.length === 0) {
        return next(new CustomError("No orders found", 404));
    }
    if (orders.length > 0) {
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.medicineId && typeof item.medicineId === 'object') {
                    item.item_id = item.medicineId._id;
                }
            });
        });
    }

    return successRes(res, 200, true, "Orders fetched successfully", { orders });
})

module.exports.getOrderById = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    let { orderId } = req.query;
    if (!orderId) {
        return next(new CustomError("Order ID is required", 400));
    }
    const order = await orderSchema.findOne({ _id: orderId, customerId: userId });
    if (!order) {
        return next(new CustomError("Order not found", 404));
    }
    return successRes(res, 200, true, "Order fetched successfully", { order });
})

module.exports.cancleOrder = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    let { orderId } = req.query;
    if (!orderId) {
        return next(new CustomError("Order ID is required", 400));
    }
    const order = await orderSchema.findOne({ _id: orderId, customerId: userId });
    if (!order) {
        return next(new CustomError("Order not found", 404));
    }
    order.orderStatus = "cancelled";
    await order.save();
    return successRes(res, 200, true, "Order cancelled successfully", { order });
})

module.exports.uploadPrescription = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;

    if (!req.files || req.files.length === 0) {
        return next(new CustomError("No files uploaded.", 400));
    }

    const filePaths = req.files.map(file => ({
        path: `${process.env.PRESCRIPTION_IMAGE_PATH}${file.filename}`,
        uploaded_at: new Date()
    }));

    const prescription = new pescriptionSchema({
        user_id: userId,
        prescriptions: filePaths
    });

    await prescription.save();

    return successRes(res, 200, true, "Prescriptions uploaded successfully", prescription);
});


