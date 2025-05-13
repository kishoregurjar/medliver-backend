const ordersModel = require("../../modals/orders.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");

module.exports.getRequestedOrder = asyncErrorHandler(async (req, res, next) => {
    const deliveryPartnerId = req.partner._id;
    const orders = await ordersModel.find({ deliveryPartnerId: deliveryPartnerId }).populate('assignedPharmacyId')
    return successRes(res, 200, true, "Orders fetched successfully", orders);
})