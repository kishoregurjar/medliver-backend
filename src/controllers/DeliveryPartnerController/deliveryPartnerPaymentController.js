const deliveryPartnerPaymentModel = require("../../modals/deliveryPartnerPayment.model");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");

module.exports.getDeliveryPartnerPayment = asyncErrorHandler(async (req, res, next) => {
    let { paymentStatus, timePeriod } = req.query;
    if (!paymentStatus) {
        return next(new CustomError("Payment Status is required", 400));
    }
    if (!timePeriod) {
        return next(new CustomError("Time Period is required", 400));
    }
    let deliveryPartnerPayment = await deliveryPartnerPaymentModel.find({ paymentStatus, timePeriod });
    return successRes(res, 200, true, "Delivery Partner Payment fetched successfully", deliveryPartnerPayment); ``
})