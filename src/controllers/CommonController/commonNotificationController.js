const notificationIdSchema = require("../../modals/notificationId.model");

const  asyncErrorHandler  = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const { successRes } = require("../../services/response");



module.exports.saveNotificationId = asyncErrorHandler(async (req, res, next) => {
    const { deviceToken } = req.body;

    if (!deviceToken) {
        return next(new CustomError("Notification ID is required", 400));
    }

    const existingNotification = await notificationIdSchema.findOne({ deviceToken });
    if (existingNotification) {
        return successRes(res, 200, false, "Notification ID already exists", existingNotification);
    }

    const newNotification = new notificationIdSchema({ deviceToken });
    await newNotification.save();

    return successRes(res, 200, true, "Notification ID saved successfully", newNotification);
});

