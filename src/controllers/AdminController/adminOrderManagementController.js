const ordersModel = require("../../modals/orders.model");
const pharmacyModel = require("../../modals/pharmacy.model");
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
});

module.exports.getNearByPharmacyToCustomer = asyncErrorHandler(async (req, res, next) => {
    let { orderId } = req.query;

    if (!orderId) {
        return next(new CustomError("Order ID is required", 400));
    }

    let order = await ordersModel.findById(orderId).select('deliveryAddress orderStatus');
    if (!order) {
        return next(new CustomError("Order not found", 404));
    }
    if (order.orderStatus !== "need_manual_assignment_to_pharmacy") {
        return next(new CustomError("This order cannot be assigned manually to a pharmacy", 400));
    }

    const nearbyPharmacies = await pharmacyModel.find({
        pharmacyCoordinates1: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [22.69992214152458, 75.83582576647855] // [longitude, latitude]
                },
                $maxDistance: 500000 // in meters
            }
        }
    });

    return successRes(res, 200, true, "Orders fetched successfully", nearbyPharmacies);
})
