const notificationIdSchema = require("../../modals/notificationId.model");
const  asyncErrorHandler  = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const { successRes } = require("../../services/response");
const { sendExpoNotification } = require("../../utils/expoNotification");


module.exports.sendGlobalNotification = asyncErrorHandler(async (req, res, next) => {
    const {title,body,data} = req.body;

    if (!title || !body) {
        return next(new CustomError("Title and body are required", 400));
    }

    const notificationIds = await notificationIdSchema.find();
    if (notificationIds.length === 0) {
        return successRes(res, 200, false, "No notification IDs found", []);
    }
    const tokens = notificationIds.map(notification => notification.deviceToken);
    
 
    try {
        const response = await sendExpoNotification(tokens, title, body, data);
        if (!response) {
            return next(new CustomError("Failed to send notification", 500));
        }
        return successRes(res, 200, true, "Notification sent successfully", response);
    } catch (error) {
        return next(new CustomError("Failed to send notification", 500));
    }
});