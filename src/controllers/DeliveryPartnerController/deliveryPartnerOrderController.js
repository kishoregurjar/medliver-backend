const ordersModel = require("../../modals/orders.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");

module.exports.getRequestedOrder = asyncErrorHandler(async (req, res, next) => {
    const deliveryPartnerId = req.partner._id;
    const orders = await ordersModel.find({ deliveryPartnerId: deliveryPartnerId }).populate('assignedPharmacyId')
    return successRes(res, 200, true, "Orders fetched successfully", orders);
})

module.exports.getOrderById = asyncErrorHandler(async (req, res, next) => {
    const deliveryPartnerId = req.partner._id;
    console.log("deliveryPartnerId", deliveryPartnerId);
    let { orderId } = req.query;
    if (!orderId) {
        return next(new CustomError("Order ID is required", 400));
    }
    const order = await ordersModel.findOne({ _id: orderId, deliveryPartnerId: deliveryPartnerId }).select('-orderStatus -pharmacyQueue -deliveryPartnerQueue -pharmacyResponseStatus -pharmacyAttempts -deliveryPartnerAttempts').populate('assignedPharmacyId', 'pharmacyName address phone completeAddress').populate('customerId', 'fullName phoneNumber profilePicture');
    if (!order) {
        return next(new CustomError("Order not found", 404));
    }
    return successRes(res, 200, true, "Order fetched successfully", order);
})