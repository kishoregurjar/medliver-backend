const ordersModel = require("../../modals/orders.model");
const pharmacyModel = require("../../modals/pharmacy.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");


module.exports.getAllAssignedOrder = asyncErrorHandler(async (req, res, next) => {
    const adminId = req.admin._id;
    const findPharmacy = await pharmacyModel.findOne({ adminId });

    if (!findPharmacy) {
        return next(new CustomError("Pharmacy not found", 404));
    }

    const pharmacyId = findPharmacy._id;
    const orders = await ordersModel.find({
        pharmacyAttempts: {
            $elemMatch: {
                pharmacyId: pharmacyId,
                status: "pending"
            }
        }
    });

    return successRes(res, 200, true, "Orders fetched successfully", orders);
});
