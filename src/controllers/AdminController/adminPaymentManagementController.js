const moment = require("moment");
const deliveryPartnerPaymentModel = require("../../modals/deliveryPartnerPayment.model");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { successRes } = require("../../services/response");
const CustomError = require("../../utils/customError");

module.exports.getDeliveryPartnerPayment = asyncErrorHandler(async (req, res, next) => {
    let { paymentStatus, timePeriod, deliveryPartnerId } = req.query;

    if (!paymentStatus) {
        return next(new CustomError("Payment Status is required", 400));
    }
    if (!timePeriod) {
        return next(new CustomError("Time Period is required", 400));
    }

    const now = new Date();
    let filter = { paymentStatus, deliveryPartnerId };

    switch (timePeriod.toLowerCase()) {
        case "1 day":
            filter.createdAt = { $gte: moment(now).subtract(1, 'days').toDate() };
            break;
        case "1 week":
            filter.createdAt = { $gte: moment(now).subtract(1, 'weeks').toDate() };
            break;
        case "1 month":
            filter.createdAt = { $gte: moment(now).subtract(1, 'months').toDate() };
            break;
        case "1 year":
            filter.createdAt = { $gte: moment(now).subtract(1, 'years').toDate() };
            break;
        case "all":
            break;
        default:
            return next(new CustomError("Invalid time period", 400));
    }

    let deliveryPartnerPayment = await deliveryPartnerPaymentModel.find(filter).populate("orderId");

    return successRes(res, 200, true, "Delivery Partner Payment fetched successfully", deliveryPartnerPayment);
});