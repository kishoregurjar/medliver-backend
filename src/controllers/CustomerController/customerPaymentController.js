const Razorpay = require('razorpay');
const crypto = require('crypto');
const shortid = require('shortid');
const asyncErrorHandler = require('../../utils/asyncErrorHandler');
const { successRes } = require('../../services/response');
const userPaymentModel = require('../../modals/userPayment.model');

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports.createOrder = asyncErrorHandler(async (req, res, next) => {
    let { amount } = req.body;
    if (!amount) {
        return next(new CustomError("Amount is required", 400));
    }
    const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: shortid.generate(),
        payment_capture: 1
    };
    const order = await instance.orders.create(options);
    return successRes(res, 200, true, "Order created successfully", order);
})

module.exports.verifyPayment = asyncErrorHandler(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        const payment = await instance.payments.fetch(razorpay_payment_id);

        await userPaymentModel.create({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            email: payment.email,
            contact: payment.contact,
            vpa: payment.vpa || payment.upi?.vpa,
            bank: payment.bank,
            wallet: payment.wallet,
            description: payment.description,
            fee: payment.fee,
            tax: payment.tax,
            rrn: payment.acquirer_data?.rrn,
            upi_transaction_id: payment.acquirer_data?.upi_transaction_id,
        });

        // Optional: Save payment in DB here
        return successRes(res, 200, true, "Payment verified successfully", {
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            payment
        });
    } else {
        return next(new CustomError("Payment verification failed", 400));
    }
});