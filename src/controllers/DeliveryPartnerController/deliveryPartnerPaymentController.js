const moment = require("moment");
const deliveryPartnerPaymentModel = require("../../modals/deliveryPartnerPayment.model");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { successRes } = require("../../services/response");
const CustomError = require("../../utils/customError");

module.exports.getDeliveryPartnerPayment = asyncErrorHandler(async (req, res, next) => {
    let { paymentStatus, timePeriod, year, month } = req.query;
    let deliveryPartnerId = req.partner._id;

    if (!paymentStatus) {
        return next(new CustomError("Payment Status is required", 400));
    }

    const now = new Date();
    let filter = { paymentStatus, deliveryPartnerId };

    // Priority: year/month filters over timePeriod
    if (year && month) {
        // Specific month in a specific year
        const startDate = moment().year(Number(year)).month(Number(month) - 1).startOf("month").toDate();
        const endDate = moment().year(Number(year)).month(Number(month) - 1).endOf("month").toDate();
        filter.createdAt = { $gte: startDate, $lte: endDate };

    } else if (year) {
        // Full year filter
        const startDate = moment().year(Number(year)).startOf("year").toDate();
        const endDate = moment().year(Number(year)).endOf("year").toDate();
        filter.createdAt = { $gte: startDate, $lte: endDate };

    } else {
        // Use timePeriod if year/month not given
        switch (timePeriod?.toLowerCase()) {
            case "1 day":
                filter.createdAt = { $gte: moment().startOf("day").toDate() };
                break;

            case "1 week":
                filter.createdAt = { $gte: moment().startOf("isoWeek").toDate() };
                break;

            case "1 month":
                filter.createdAt = { $gte: moment().startOf("month").toDate() };
                break;

            case "1 year":
                filter.createdAt = { $gte: moment().startOf("year").toDate() };
                break;

            case "all":
                // No filter
                break;

            default:
                return next(new CustomError("Invalid time period", 400));
        }
    }

    let deliveryPartnerPayment = await deliveryPartnerPaymentModel
        .find(filter)
        .populate("orderId");

    return successRes(
        res,
        200,
        true,
        "Delivery Partner Payment fetched successfully",
        deliveryPartnerPayment
    );
});

module.exports.getTotalEarnings = asyncErrorHandler(async (req, res, next) => {
    let { timePeriod, year, month } = req.query;
    let deliveryPartnerId = req.partner._id;

    let match = {
        deliveryPartnerId,
        paymentStatus: 'paid' // only count paid
    };

    if (year && month) {
        // Specific month of a specific year
        const start = moment().year(Number(year)).month(Number(month) - 1).startOf("month").toDate();
        const end = moment().year(Number(year)).month(Number(month) - 1).endOf("month").toDate();
        match.paidAt = { $gte: start, $lte: end };

    } else if (year) {
        // Full year
        const start = moment().year(Number(year)).startOf("year").toDate();
        const end = moment().year(Number(year)).endOf("year").toDate();
        match.paidAt = { $gte: start, $lte: end };

    } else {
        switch (timePeriod?.toLowerCase()) {
            case "1 day":
                match.paidAt = { $gte: moment().startOf("day").toDate() };
                break;
            case "1 week":
                match.paidAt = { $gte: moment().startOf("isoWeek").toDate() };
                break;
            case "1 month":
                match.paidAt = { $gte: moment().startOf("month").toDate() };
                break;
            case "1 year":
                match.paidAt = { $gte: moment().startOf("year").toDate() };
                break;
            case "all":
                // no filter
                break;
            default:
                return next(new CustomError("Invalid time period", 400));
        }
    }

    const result = await deliveryPartnerPaymentModel.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: "$amount" },
                totalOrders: { $sum: 1 }
            }
        }
    ]);

    return successRes(res, 200, true, "Total earnings fetched successfully", {
        totalEarnings: result[0]?.totalEarnings || 0,
        totalOrders: result[0]?.totalOrders || 0
    });
});

