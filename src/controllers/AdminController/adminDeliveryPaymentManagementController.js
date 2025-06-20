const moment = require("moment");
const deliveryPartnerPaymentModel = require("../../modals/deliveryPartnerPayment.model");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { successRes } = require("../../services/response");
const CustomError = require("../../utils/customError");
const DeliveryPartnerPayoutHistory = require("../../modals/DeliveryPartnerPayoutHistory");

module.exports.getDeliveryPartnerPayment = asyncErrorHandler(async (req, res, next) => {
    let { paymentStatus, timePeriod, year, month, deliveryPartnerId } = req.query;
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

module.exports.payDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const { remarks, deliveryPartnerId, deliveryPartnerEarningIds } = req.body;

    if (!deliveryPartnerId || !Array.isArray(deliveryPartnerEarningIds) || deliveryPartnerEarningIds.length === 0) {
        return next(new CustomError("Delivery Partner ID and earning IDs are required", 400));
    }

    // Fetch the earnings before update to extract orderIds and total amount
    const earnings = await deliveryPartnerPaymentModel.find({
        _id: { $in: deliveryPartnerEarningIds },
        deliveryPartnerId,
        paymentStatus: 'pending'
    });

    if (earnings.length === 0) {
        return next(new CustomError("No pending payments found for given IDs", 404));
    }

    const totalAmount = earnings.reduce((sum, item) => sum + item.amount, 0);
    const orderIds = earnings.map(item => item.orderId);

    // 1. Update earnings to mark them as paid
    await deliveryPartnerPaymentModel.updateMany(
        { _id: { $in: deliveryPartnerEarningIds } },
        {
            $set: {
                paymentStatus: "paid",
                paymentDate: new Date(),
                paidAt: new Date(),
                remarks: remarks || ""
            }
        }
    );

    // 2. Record payout history
    await DeliveryPartnerPayoutHistory.create({
        deliveryPartnerId,
        orderIds,
        earningIds: deliveryPartnerEarningIds,
        totalAmountPaid: totalAmount,
        remarks,
        paidAt: new Date()
    });

    return successRes(
        res,
        200,
        true,
        `Payment of ₹${totalAmount} recorded successfully for ${earnings.length} orders.`,
        {
            totalPaid: totalAmount,
            orderCount: earnings.length
        }
    );
});