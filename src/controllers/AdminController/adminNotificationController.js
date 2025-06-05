const notificationIdSchema = require("../../modals/notificationId.model");
const  asyncErrorHandler  = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const { successRes } = require("../../services/response");
const { sendExpoNotification } = require("../../utils/expoNotification");
const notificationModel = require("../../modals/notification.model");


// module.exports.sendGlobalNotification = asyncErrorHandler(async (req, res, next) => {
//     const {title,body,data} = req.body;

//     if (!title || !body) {
//         return next(new CustomError("Title and body are required", 400));
//     }

//     const  notification = await notificationModel.create({
//         title,
//         message:body,
//         recipientType: "customer",
//         notificationType: "global_notification",
//     })

//     const notificationIds = await notificationIdSchema.find();
//     if (notificationIds.length === 0) {
//         return successRes(res, 200, false, "No notification IDs found", []);
//     }
//     const tokens = notificationIds.map(notification => notification.deviceToken);
    
 
//     try {
//         const response = await sendExpoNotification(tokens, title, body, data);
//         if (!response) {
//             return next(new CustomError("Failed to send notification", 500));
//         }
//         return successRes(res, 200, true, "Notification sent successfully", response);
//     } catch (error) {
//         return next(new CustomError("Failed to send notification", 500));
//     }
// });



module.exports.sendGlobalNotification = asyncErrorHandler(async (req, res, next) => {
    const { title, body, data } = req.body;
  
    if (!title || !body) {
      return next(new CustomError("Title and body are required", 400));
    }
  
    // Save notification in DB
    const notification = await notificationModel.create({
      title,
      message: body,
      recipientType: "customer",
      notificationType: "global_notification",
    });
    
    if (!notification) {
      return next(new CustomError("Failed to save notification", 500));
    }
    
    // Fetch all device tokens
    const notificationIds = await notificationIdSchema.find();
    if (notificationIds.length === 0) {
      return successRes(res, 200, false, "No notification IDs found", []);
    }
  
    // Extract valid tokens
    const tokens = notificationIds.map(n => n.deviceToken).filter(Boolean);
  
    if (tokens.length === 0) {
      return successRes(res, 200, false, "No valid device tokens found", []);
    }
  
    // Send the notification
    try {
      const response = await sendExpoNotification(tokens, title, body, data);
  
      if (!response) {
        return next(new CustomError("Failed to send notification", 500));
      }
  
      return successRes(res, 200, true, "Notification sent successfully", response);
    } catch (error) {
      console.error("Notification Error:", error);
      return next(new CustomError("Failed to send notification", 500));
    }
  });
  