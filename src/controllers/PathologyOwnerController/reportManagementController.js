const orderPathologyModel = require("../../modals/orderPathologyModel");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const TestReport = require("../../modals/reportModel");
const { successRes } = require("../../services/response");
const { default: mongoose } = require("mongoose");
const CustomError = require("../../utils/customError");

module.exports.updateReportToAccount = asyncErrorHandler(
  async (req, res, next) => {
    let adminId = req.admin._id;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { orderId, reportName, reportFiles } = req.body;

      if (!orderId) {
        await session.abortTransaction();
        return next(new CustomError("Order ID is required", 400));
      }
      if (!reportName) {
        await session.abortTransaction();
        return next(new CustomError("Report name is required", 400));
      }
      if (!Array.isArray(reportFiles) || reportFiles.length === 0) {
        await session.abortTransaction();
        return next(new CustomError("Report files are required", 400));
      }

      const pathology =  await pathologyCenterModel.findOne({ adminId }).session(session);
      if (!pathology) {
        await session.abortTransaction();
        return next(new CustomError("Pathology center not found", 404));
      }
      const order = await orderPathologyModel
        .findById(orderId)
        .session(session);
      if (!order) {
        await session.abortTransaction();
        return next(new CustomError("Order not found", 404));
      }

      const newReport = await TestReport.create(
        [
          {
            orderId: order._id,
            customerId: order.customerId,
            pathologyCenterId: pathology._id,
            reportName,
            reportFiles,
          },
        ],
        { session }
      );

      order.reportId = newReport[0]._id; 
      await order.save({ session });

      await session.commitTransaction();
      session.endSession(); 
      return successRes(res, 200, true, "Report uploaded successfully", {
        report: newReport[0],
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession(); 
      return next(error);
    }
  }
);

module.exports.getAllTestReports = asyncErrorHandler(async (req, res, next) => {
  let { page } = req.query;
  let limit = 10;
  let skip = (page - 1) * limit;

  const [totalReports, reports] = await Promise.all([
    TestReport.countDocuments(),
    TestReport.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);
  return successRes(res, 200, true, "Reports fetched successfully", {
    reports,
    currentPage: page,
    totalPages: Math.ceil(totalReports / limit),
    totalReports,
  });
});

module.exports.deleteTestReport = asyncErrorHandler(async (req, res, next) => {
  const { reportId } = req.query;
  if (!reportId) {
    return next(new CustomError("Report ID is required", 400));
  }
  const report = await TestReport.findByIdAndDelete(reportId);
  if (!report) {
    return next(new CustomError("Report Not Deleted", 404));
  }
  return successRes(res, 200, true, "Report deleted successfully", report);
});

module.exports.getTestReportDetailsById = asyncErrorHandler(
  async (req, res, next) => {
    const { reportId } = req.query;
    if (!reportId) {
      return next(new CustomError("Report ID is required", 400));
    }
    const report = await TestReport.findById(reportId).populate("orderId").populate("customerId");
    if (!report) {
      return next(new CustomError("Report Not Found", 404));
    }
    return successRes(res, 200, true, "Report fetched successfully", report);
  }
);