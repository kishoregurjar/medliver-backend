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

/**
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
    let orderType = null;

    const orderItems = [];

    for (const item of itemsToOrder) {
        totalPrice += item.price * item.quantity;

        if (item.item_type === "medicine") {
            const medicine = await medicineModel.findById(item.item_id);
            if (medicine?.isPrescriptionRequired) prescriptionRequired = true;

            orderItems.push({
                medicineId: item.item_id,
                quantity: item.quantity,
                price: item.price,
            });

        } else if (item.item_type === "test") {
            if (item.details?.available_at_home) isTestHomeCollection = true;

            orderItems.push({
                testName: item.name,
                quantity: item.quantity,
                price: item.price,
            });
        }
    }

    const hasMedicine = itemsToOrder.some(i => i.item_type === "medicine");
    const hasTest = itemsToOrder.some(i => i.item_type === "test");

    orderType = hasMedicine && hasTest ? "mixed" : hasMedicine ? "pharmacy" : hasTest ? "pathology" : null;

    if (!orderType) {
        return next(new CustomError("Invalid items in cart", 400));
    }
    console.log(userId, "userId", deliveryAddressId, "deliveryAddressId")
    let findAddress = await customerAddressModel.findOne({
        customer_id: userId,
        _id: deliveryAddressId
    });

    if (!findAddress) {
        return next(new CustomError("Delivery address not found", 404));
    }
    console.log(findAddress, "findAddress")
    const newOrder = new orderSchema({
        customerId: userId,
        orderType,
        items: orderItems,
        totalAmount: totalPrice,
        deliveryAddressId,
        paymentMethod,
        prescriptionRequired,
        isTestHomeCollection,
    });

    await newOrder.save();

    // Remove ordered items from cart
    const updatedItems = cart.items.filter(item => !item_ids.includes(item.item_id.toString()));

    // Recalculate cart total
    const newTotalPrice = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    cart.items = updatedItems;
    cart.total_price = newTotalPrice;
    await cart.save();

    return successRes(res, 201, true, "Order created successfully", {
        order: newOrder,
    });
});
 */

const getDistance = (coord1, coord2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.long);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // returns distance in km
};

module.exports.createOrder = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { item_ids, deliveryAddressId, paymentMethod } = req.body;

    // Validate item_ids
    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
        return next(new CustomError("Item IDs are required", 400));
    }

    // Get user's cart and validate
    const cart = await cartSchema.findOne({ user_id: userId });
    if (!cart || cart.items.length === 0) {
        return next(new CustomError("Cart is empty or not found", 404));
    }

    // Filter out the items that the user wants to order
    const itemsToOrder = cart.items.filter(item => item_ids.includes(item.item_id.toString()));
    if (itemsToOrder.length === 0) {
        return next(new CustomError("No valid items found in the cart for the provided item IDs", 404));
    }

    // Calculate total price and check if prescription or test collection is required
    let totalPrice = 0;
    let prescriptionRequired = false;
    let isTestHomeCollection = false;
    const orderItems = [];

    for (const item of itemsToOrder) {
        totalPrice += item.price * item.quantity;

        if (item.item_type === "medicine") {
            const medicine = await medicineModel.findById(item.item_id);
            if (medicine?.isPrescriptionRequired) prescriptionRequired = true;
            orderItems.push({ medicineId: item.item_id, quantity: item.quantity, price: item.price });
        } else if (item.item_type === "test") {
            if (item.details?.available_at_home) isTestHomeCollection = true;
            orderItems.push({ testName: item.name, quantity: item.quantity, price: item.price });
        }
    }

    // Determine order type
    const hasMedicine = itemsToOrder.some(i => i.item_type === "medicine");
    const hasTest = itemsToOrder.some(i => i.item_type === "test");
    const orderType = hasMedicine && hasTest ? "mixed" : hasMedicine ? "pharmacy" : hasTest ? "pathology" : null;

    if (!orderType) {
        return next(new CustomError("Invalid items in cart", 400));
    }

    // Get the delivery address for the user
    const findAddress = await customerAddressModel.findOne({
        customer_id: userId,
        _id: deliveryAddressId
    });

    if (!findAddress) {
        return next(new CustomError("Delivery address not found", 404));
    }

    // Get all available pharmacies
    const allPharmacies = await pharmacySchema.find({
        status: "active",
        availabilityStatus: "available",
        pharmacyCoordinates: { $ne: null }
    });
    // Sort pharmacies by distance from delivery address
    const userCoords = findAddress.location;
    const sortedPharmacies = allPharmacies
        .map(pharmacy => ({
            pharmacy,
            distance: getDistance(userCoords, pharmacy.pharmacyCoordinates)
        }))
        .sort((a, b) => a.distance - b.distance)
        .map(entry => entry.pharmacy);

    if (sortedPharmacies.length === 0) {
        return next(new CustomError("No nearby pharmacies found", 404));
    }

    // Try to assign the first available pharmacy
    let assignedPharmacy = null;
    let pharmacyAttempts = [];

    for (const pharmacy of sortedPharmacies) {
        assignedPharmacy = pharmacy;
        console.log(assignedPharmacy, "assignedPharmacy")
        pharmacyAttempts.push({
            pharmacyId: pharmacy._id,
            status: "pending",
            attemptAt: new Date(),
        });
        console.log(pharmacyAttempts, "pharmacyAttempts")
        // Create order
        // const newOrder = new orderSchema({
        //     customerId: userId,
        //     orderType,
        //     items: orderItems,
        //     totalAmount: totalPrice,
        //     deliveryAddressId,
        //     paymentMethod,
        //     prescriptionRequired,
        //     isTestHomeCollection,
        //     pharmacyAttempts, // Log pharmacy attempts
        // });

        // await newOrder.save();

        // Notify pharmacy or handle rejection
        // Implement logic to notify pharmacy and handle acceptance/rejection here
        // return successRes(res, 201, true, "Order created successfully", {
        //     order: newOrder,
        //     assignedPharmacy: assignedPharmacy._id
        // });

        const sendNotification = await sendExpoNotification([assignedPharmacy.deviceToken], "New Order", "You have a new order", { name: "Flexon" });

        return successRes(res, 201, true, "Order created successfully", null);
    }

    // If no pharmacies accepted, return error
    return next(new CustomError("All pharmacies rejected the order", 400));
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


