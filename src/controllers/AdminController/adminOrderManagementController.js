const ordersModel = require("../../modals/orders.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");


module.exports.getAllManualOrderAssignment = asyncErrorHandler(async (req, res, next) => {
    let { assignment_for } = req.query;
    if (!assignment_for) {
        return next(new CustomError("Assignment For is required", 400));
    }
    let orderStatus = assignment_for === "pharmacy" ? "need_manual_assignment_to_pharmacy" : "need_manual_assignment_to_delivery_partner";
    let orders = await ordersModel.find({ orderStatus });
    return successRes(res, 200, true, "Orders fetched successfully", orders);
})