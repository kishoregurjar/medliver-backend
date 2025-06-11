const notificationIdSchema = require("../../modals/notificationId.model");
const notificationModel = require("../../modals/notification.model");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const { successRes } = require("../../services/response");
const jwt = require("jsonwebtoken");


module.exports.saveNotificationId = asyncErrorHandler(
  async (req, res, next) => {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return next(new CustomError("Notification ID is required", 400));
    }

    const existingNotification = await notificationIdSchema.findOne({
      deviceToken,
    });
    if (existingNotification) {
      return successRes(
        res,
        200,
        false,
        "Notification ID already exists",
        existingNotification
      );
    }

    const newNotification = new notificationIdSchema({ deviceToken });
    await newNotification.save();

    return successRes(
      res,
      200,
      true,
      "Notification ID saved successfully",
      newNotification
    );
  }
);

module.exports.getAllNotification = asyncErrorHandler(
  async (req, res, next) => {
    const token = req?.headers?.authorization;
    if (!token) {
      const notifications = await notificationModel.find({
        recipientType: "customer",
        recipientId: { $exists: false },
      });
      return successRes(
        res,
        200,
        true,
        "Notifications fetched successfully",
        notifications
      );
    }
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const userId = decoded._id;

      const notifications = await notificationModel.find({
        recipientType: "customer",
        $or: [{ recipientId: userId }, { recipientId: { $exists: false } }],
      });

      return successRes(
        res,
        200,
        true,
        "Notifications fetched successfully",
        notifications
      );
    } catch (err) {
      return next(new CustomError("Invalid or expired token", 401));
    }
  }
);



module.exports.getNotificationById = asyncErrorHandler(async (req, res, next) => {
  const token = req?.headers?.authorization;
  const { notificationId } = req.query;

  let userId = null;

  // Try to extract userId if token is present
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      userId = decoded._id;
    } catch (err) {
      return next(new CustomError("Invalid or expired token", 401));
    }
  }

  // Build the query dynamically based on userId
  let query = {
    _id: notificationId,
    recipientType: "customer",
  };

  if (userId) {
    query.$or = [
      { recipientId: userId },
      { recipientId: { $exists: false } }
    ];
  }

  const notifications = await notificationModel.find(query);

  return successRes(
    res,
    200,
    true,
    "Notifications fetched successfully",
    notifications
  );
});


