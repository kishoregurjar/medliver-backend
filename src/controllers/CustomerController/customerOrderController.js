const orderSchema = require("../../modals/orders.model");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const cartSchema = require("../../modals/cart.model");
const { successRes } = require("../../services/response");
const medicineModel = require("../../modals/medicine.model");
const pescriptionSchema = require("../../modals/pescriptionSchema");


module.exports.createOrder = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    let { item_ids, deliveryAddress, paymentMethod } = req.body;

    const cart = await cartSchema.findOne({ user_id: userId });
    if (!cart) {
        return next(new CustomError("Cart not found", 404));
    }

    if (cart.items.length === 0) {
        return next(new CustomError("Cart is empty", 400));
    }
    if (!item_ids || item_ids.length === 0) {
        return next(new CustomError("Item IDs are required", 400));
    }

    const itemsToOrder = cart.items.filter(item => item_ids.includes(item.item_id.toString()));
    if (itemsToOrder.length === 0) {
        return next(new CustomError("No items found in the cart for the provided item IDs", 404));
    }

    const totalPrice = itemsToOrder.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    if (totalPrice === 0) {
        return next(new CustomError("Total price is zero", 400));
    }

    let prescriptionRequired = false;
    let isTestHomeCollection = false;
    let orderType;

    for (const item of itemsToOrder) {
        if (item.item_type === "medicine") {
            // yahan tujhe Medicine model se find karna padega prescriptionRequired check karne ke liye
            const medicine = await medicineModel.findById(item.item_id);
            if (medicine?.isPrescriptionRequired) {
                prescriptionRequired = true;
            }
        }
        if (item.item_type === "test") {
            if (item.details?.available_at_home) {
                isTestHomeCollection = true;
            }
        }
    }

    const hasMedicine = itemsToOrder.some(item => item.item_type === "medicine");
    const hasTest = itemsToOrder.some(item => item.item_type === "test");

    if (hasMedicine && hasTest) {
        orderType = "mixed";
    } else if (hasMedicine) {
        orderType = "pharmacy";
    } else if (hasTest) {
        orderType = "pathology";
    } else {
        return next(new CustomError("Invalid items in cart", 400));
    }

    // Now map items properly
    const orderItems = itemsToOrder.map(item => {
        if (item.item_type === "medicine") {
            return {
                medicineId: item.item_id,
                quantity: item.quantity,
                price: item.price,
            };
        } else if (item.item_type === "test") {
            return {
                testName: item.name,
                quantity: item.quantity,
                price: item.price,
            };
        }
    });

    const newOrder = new orderSchema({
        customerId: userId,
        orderType: orderType,
        items: orderItems,
        totalAmount: totalPrice,
        deliveryAddress: deliveryAddress,
        paymentMethod: paymentMethod,
        prescriptionRequired: prescriptionRequired,
        isTestHomeCollection: isTestHomeCollection,
    });

    await newOrder.save();

    await cartSchema.updateOne(
        { user_id: userId },
        { $pull: { items: { item_id: { $in: item_ids } } } }
    );

    return successRes(res, 201, true, "Order created successfully", {
        order: newOrder,
    });
});

module.exports.getAllOrders = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    const orders = await orderSchema.find({ customerId: userId }).populate("items.medicineId").sort({ createdAt: -1 });
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


