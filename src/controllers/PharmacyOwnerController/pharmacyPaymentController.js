const ordersModel = require("../../modals/orders.model");
const pharmacyModel = require("../../modals/pharmacy.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");

module.exports.getAllPayments = asyncErrorHandler(async (req, res, next) => {
    const { timePeriod, year, month, paymentStatus } = req.query;
    let pharmacyId = req.admin._id;

    let match = {
        orderType: 'pharmacy',
        // orderStatus: 'completed',
        assignedPharmacyId: pharmacyId
    };

    let findPharmacy = await pharmacyModel.findOne({ adminId: pharmacyId });
    if (!findPharmacy) {
        return next(new CustomError("Pharmacy not found", 404));
    }
    match.assignedPharmacyId = findPharmacy._id;

    if (paymentStatus) {
        match.paymentStatus = paymentStatus;
    }

    // Apply date filters
    if (year && month) {
        const start = moment().year(Number(year)).month(Number(month) - 1).startOf('month').toDate();
        const end = moment().year(Number(year)).month(Number(month) - 1).endOf('month').toDate();
        match.createdAt = { $gte: start, $lte: end };
    } else if (year) {
        const start = moment().year(Number(year)).startOf('year').toDate();
        const end = moment().year(Number(year)).endOf('year').toDate();
        match.createdAt = { $gte: start, $lte: end };
    } else if (timePeriod) {
        switch (timePeriod.toLowerCase()) {
            case '1 day':
                match.createdAt = { $gte: moment().startOf('day').toDate() };
                break;
            case '1 week':
                match.createdAt = { $gte: moment().startOf('isoWeek').toDate() };
                break;
            case '1 month':
                match.createdAt = { $gte: moment().startOf('month').toDate() };
                break;
            case '1 year':
                match.createdAt = { $gte: moment().startOf('year').toDate() };
                break;
            case 'all':
                break;
            default:
                return next(new CustomError("Invalid time period", 400));
        }
    }
    console.log(match, "match")
    const payments = await ordersModel.find(match)
        .populate("customerId", "name phone")
        .populate("assignedPharmacyId", "name address")
        // .populate("pharmacyPaymentId")
        .sort({ createdAt: -1 });

    const totalPaidAmount = payments.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return successRes(res, 200, true, "Pharmacy payments fetched successfully", {
        totalPaidAmount,
        count: payments.length,
        payments
    });
});