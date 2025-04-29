const Razorpay = require("razorpay");
const userPaymentModel = require("../../modals/userPayment.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports.initiateRefund = asyncErrorHandler(async (req, res, next) => {
    const { payment_id, amount, speed = "normal" } = req.body;

    if (!payment_id) {
        return next(new CustomError("Payment ID is required", 400));
    }

    const payment = await instance.payments.fetch(payment_id);
    if (!payment || payment.status !== "captured") {
        return next(new CustomError("Invalid or uncaptured payment", 400));
    }

    const refundOptions = { speed };
    if (amount) refundOptions.amount = amount * 100;

    const refund = await instance.payments.refund(payment_id, refundOptions);

    await userPaymentModel.findOneAndUpdate(
        { razorpay_payment_id: payment_id },
        {
            refund_status: "pending",
            refund_id: refund.id,
            refund_amount: refund.amount,
            refunded_at: null,
        },
        { new: true }
    );

    return successRes(res, 200, true, "Refund initiated successfully", refund);
});