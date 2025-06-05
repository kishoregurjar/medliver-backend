const orderPathologyModel = require("../../modals/orderPathologyModel");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const TestReport = require('../../modals/reportModel')

module.exports.updateReportToAccount = asyncErrorHandler(async (req, res, next) => {
    const { orderId, reportName, reportFiles } = req.body;

    if (!orderId) {
        return next(new CustomError("Order ID is required", 400));
    }
    if (!reportName) {
        return next(new CustomError("Report name is required", 400));
    }
    if (!Array.isArray(reportFiles) || reportFiles.length === 0) {
        return next(new CustomError("Report files are required", 400));
    }

    const order = await orderPathologyModel.findById(orderId);
    if (!order) {
        return next(new CustomError("Order not found", 404));
    }

    const newReport = await TestReport.create({
        orderId: order._id,
        customerId: order.customerId,
        reportName,
        reportFiles
    });

    return successRes(res, 200, true, "Report uploaded successfully", { report: newReport });
});