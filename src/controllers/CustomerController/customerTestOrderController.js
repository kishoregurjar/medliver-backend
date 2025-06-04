const orderPathologyModel = require('../../modals/orderPathologyModel');
const CustomError = require('../../utils/customError');
const asyncErrorHandler = require('../../utils/asyncErrorHandler');
const { successRes } = require("../../services/response");
const customerAddressModel = require('../../modals/customerAddress.model');
const pathologySchema = require('../../modals/pathology.model');
const TestModel = require('../../modals/test.model');
const TestCategory = require('../../modals/testCategory'); 
const notificationModel = require('../../modals/notification.model');
const adminSchema = require('../../modals/admin.Schema');
const { sendExpoNotification } = require('../../utils/expoNotification');
const { default: mongoose } = require('mongoose');
const { getDistance } = require('../../utils/helper');


module.exports.createPathologyOrder = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { test_ids, deliveryAddressId, paymentMethod } = req.body;

  if (!test_ids || !Array.isArray(test_ids) || test_ids.length === 0) {
    return next(new CustomError("Test IDs are required", 400));
  }


  let totalAmount = 0;
  let isHomeCollection = false;
  const selectedTests = test_ids;

  const findAddress = await customerAddressModel.findOne({
    customer_id: userId,
    _id: deliveryAddressId,
  });

  if (!findAddress) {
    return next(new CustomError("Delivery address not found", 404));
  }
  const convertedTestIds = test_ids.map(id => new mongoose.Types.ObjectId(id));

  const allCenters = await pathologySchema.find({
    isActive: true,
    availabilityStatus: "available",
    deviceToken: { $ne: null },
    centerCoordinates: { $ne: null },
    availableTests: {
      $elemMatch: {
        testId: { $in: convertedTestIds }
      }
    }
  });
  
  const userCoords = findAddress.location;
  
  const sortedCenters = allCenters
    .map((center) => ({
      center,
      distance: getDistance(userCoords, center.centerCoordinates),
    }))
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.center);

  const assignedCenter = sortedCenters[0] || null;

  const newOrder = new orderPathologyModel({
    customerId: userId,
    pathologyCenterId: assignedCenter?._id || null,
    selectedTests: convertedTestIds,
    totalAmount: assignedCenter ? assignedCenter.availableTests.price : 0,
    isHomeCollection: assignedCenter ? assignedCenter.availableTests.availabilityAtHome : false,
    paymentMethod: paymentMethod,
    deliveryAddress: {
      street: findAddress?.street,
      city: findAddress?.city,
      state: findAddress?.state,
      pincode: findAddress?.pincode,
      coordinates: {
        lat: findAddress?.location?.lat,
        long: findAddress?.location?.long,
      },
    },
    pathologyAttempts: [
      {
        pathologyId: assignedCenter?._id || null,
        status: "pending",
        attemptedAt: new Date(),
      },
    ],
  });

  await newOrder.save();


  // Notify pathology center or admin
  let notification;

  if (assignedCenter) {
    notification = new notificationModel({
      title: "New Pathology Order",
      message: "You have a new test booking",
      recipientId: assignedCenter._id,
      recipientType: "pathology",
      NotificationTypeId: newOrder._id,
      notificationType: "pathology_order_request",
    });
    await sendExpoNotification(
      [assignedCenter.deviceToken],
      "New Test Booking",
      "You have a new pathology test booking",
      notification
    );
  } else {
    const admins = await adminSchema.find({ role: "superadmin" });
    for (const admin of admins) {
      notification = new notificationModel({
        title: "Manual Pathology Assignment",
        message: "No pathology center available. Manual assignment required.",
        recipientId: admin._id,
        recipientType: "admin",
        NotificationTypeId: newOrder._id,
        notificationType: "manual_pathology_assignment",
      });
      newOrder.orderStatus = "need_manual_assignment_to_pathology";
      await newOrder.save();
      await sendExpoNotification(
        [admin.deviceToken],
        "Manual Assignment Needed",
        "No pathology center available",
        notification
      );
    }
  }

  if (notification) await notification.save();

  return successRes(res, 201, true, "Pathology order placed successfully", {
    pathologyOrder: newOrder,
    notification,
    assignedTo: assignedCenter ? "pathology center" : "admin",
  });
});


module.exports.popularTest = asyncErrorHandler(async (req, res, next) => {
  let { page, limit } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;
  const filter = { available: true };

  const [totalTests, allTests] = await Promise.all([
    TestModel.countDocuments(filter),
    TestModel.aggregate([{ $sample: { size: limit } }])  //for randome 5 tests
  ]);

  if (allTests.length === 0) {
    return successRes(res, 200, false, "No popular tests found", []);
  }

  return successRes(res, 200, true, "Popular tests fetched successfully", {
    tests: allTests,
    currentPage: page,
    totalPages: Math.ceil(totalTests / limit),
    totalTests,
  });
});


module.exports.getTestsByCategoryId = asyncErrorHandler(async (req, res, next) => {
  const { categoryId } = req.query;

  const category = await TestCategory.findById(categoryId).populate({
    path: "tests",
    match: { available: true }, 
    select: "name price description image_url bookedCount", 
  });

  if (!category) {
    return next(new CustomError("Test category not found", 404));
  }

  return successRes(res, 200, true, "Tests for this category fetched successfully", {
    categoryName: category.name,
    categoryDescription: category.description,
    tests: category.tests,
  });
});


module.exports.getTestDetails = asyncErrorHandler(async (req, res, next) => {
  const { testId } = req.query;

  const test = await TestModel.findById(testId)

  if (!test) {
    return next(new CustomError("Test not found", 404));
  }

  return successRes(res, 200, true, "Test details fetched successfully", test);
});

// module.exports.cancelOrderFromUser = asyncErrorHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const { orderId, reason } = req.body;

//   if (!orderId) {
//     return next(new CustomError("Order ID is required", 400));
//   }

//   if (!reason || reason.trim() === "") {
//     return next(new CustomError("Cancellation reason is required", 400));
//   }

//   const order = await orderPathologyModel.findOne({
//     _id: orderId,
//     customerId: userId,
//   });

//   if (!order) {
//     return next(new CustomError("Order not found or unauthorized access", 404));
//   }

//   if (["completed", "cancelled"].includes(order.orderStatus)) {
//     return next(new CustomError(`Order is already ${order.orderStatus}`, 400));
//   }

//   order.orderStatus = "cancelled";
//   order.cancellationReason = reason;
//   await order.save();

//   if (order.pathologyCenterId) {
//     const pathology = await pathologySchema.findById(order.pathologyCenterId);

//     if (pathology && pathology.deviceToken) {
//       const notification = new notificationModel({
//         title: "Test Order Cancelled",
//         message: `A customer has cancelled their pathology test order.`,
//         recipientId: pathology._id,
//         recipientType: "pathology",
//         NotificationTypeId: order._id,
//         notificationType: "pathology_order_cancelled_by_user",
//       });

//       await notification.save();

//       await sendExpoNotification(
//         [pathology.deviceToken],
//         "Order Cancelled",
//         "A customer cancelled a pathology test order.",
//         notification
//       );
//     }
//   }

//   return successRes(res, 200, true, "Order cancelled successfully by user", {
//     orderId: order._id,
//     orderStatus: order.orderStatus,
//     cancellationReason: order.cancellationReason,
//   });
// });

module.exports.cancelOrderFromUser = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { orderId, reason } = req.body;

  if (!orderId) {
    return next(new CustomError("Order ID is required", 400));
  }

  if (!reason) {
    return next(new CustomError("Cancellation reason is required", 400));
  }

  const order = await orderPathologyModel.findOne({ _id: orderId, customerId: userId });

  if (!order) {
    return next(new CustomError("Order not found", 404));
  }

  if (["completed", "cancelled"].includes(order.orderStatus)) {
    return next(new CustomError(`Order is already ${order.orderStatus}`, 400));
  }

  order.orderStatus = "cancelled";
  order.cancellationReason = reason;
  await order.save();

  return successRes(res, 200, true, "Order cancelled successfully", {
    orderId: order._id,
    orderStatus: order.orderStatus,
    cancellationReason: order.cancellationReason,
  });
});


// module.exports.getOrdersPathology = asyncErrorHandler(async (req, res, next) => {
//   const customerId = req.user._id;

//   const orders = await orderPathologyModel.find({ customerId })
//     .sort({ createdAt: -1 })
//     .populate("selectedTests", "name price")
//     .populate("pathologyCenterId", "centerName contactInfo");

//   return successRes(res, 200, true, "Customer pathology orders fetched successfully", orders);
// });

module.exports.getOrdersPathology = asyncErrorHandler(async (req, res, next) => {
  const customerId = req.user._id;

  const orders = await orderPathologyModel.find({ customerId })
    .sort({ createdAt: -1 })
    .populate("selectedTests", "name price")
    .populate("pathologyCenterId")
    .populate("customerId") // optional, for wrapping
 // assumes addressId is a ref

  const formattedOrders = orders.map(order => ({
    _id: order._id,
    customer: order.customerId, // already populated
    pathologyCenter: order.pathologyCenterId,
    selectedTests: order.selectedTests,
    isHomeCollection: order.isHomeCollection,
    orderStatus: order.orderStatus,
    reportStatus: order.reportStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    pathologyAttempts: order.pathologyAttempts,
    orderDate: order.orderDate,
    cancellationReason: order.cancellationReason,
    // createdAt: order.createdAt,
    // updatedAt: order.updatedAt,
  }));

  return successRes(res, 200, true, "Customer pathology orders fetched successfully", orders);
});


// module.exports.getOrderDetailsPathology = asyncErrorHandler(async (req, res, next) => {
//   const customerId = req.user._id;
//   const { orderId } = req.query;

//   const order = await orderPathologyModel.findById(orderId, { customerId })
//     .populate("selectedTests")
//     .populate("pathologyCenterId")
//     .populate("customerId")


//   if (!order) {
//     return next(new CustomError("Order not found", 404));
//   }

//   return successRes(res, 200, true, "Order details fetched successfully", order);
// });

module.exports.getOrderDetailsPathology = asyncErrorHandler(async (req, res, next) => {
  const customerId = req.user._id;
  const { orderId } = req.query;

  if (!orderId) {
    return next(new CustomError("Order ID is required", 400));
  }

  const order = await orderPathologyModel
    .findOne({ _id: orderId, customerId })
    .populate("selectedTests._id", "name price") 
    .populate("pathologyCenterId", "centerName phoneNumber")
    .populate("customerId", "fullName email phoneNumber");

  if (!order) {
    return next(new CustomError("Order not found", 404));
  }

  const formattedOrder = {
    _id: order._id,
    customer: order.customerId,
    pathologyCenter: order.pathologyCenterId,
    selectedTests: order.selectedTests.map((item) => ({
      _id: item.testId?._id,
      name: item.testId?.name,
      price: item.testId?.price
    })),
    isHomeCollection: order.isHomeCollection,
    orderStatus: order.orderStatus,
    reportStatus: order.reportStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    pathologyAttempts: order.pathologyAttempts,
    orderDate: order.orderDate,
    cancellationReason: order.cancellationReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };

  return successRes(res, 200, true, "Order details fetched successfully", formattedOrder);
});



  module.exports.searchOrdersPathology = asyncErrorHandler(async (req, res, next) => {
  let { value, page, limit } = req.query;

  if (!value) {
    return next(new CustomError("Search value is required", 400));
  }

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const regex = new RegExp(value.trim(), "i");

  const searchQuery = {
    $or: [
      { orderStatus: regex },
      { paymentStatus: regex },
      { orderType: regex },      // if you have this field in pathology orders schema
      { paymentMethod: regex },
    ],
  };

  const [totalOrders, orders] = await Promise.all([
    orderPathologyModel.countDocuments(searchQuery),
    orderPathologyModel
      .find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("selectedTests.testId", "name")
      .populate("pathologyCenterId", "centerName"),
  ]);

  if (orders.length === 0) {
    return successRes(res, 200, false, "No orders found", []);
  }

  return successRes(res, 200, true, "Orders fetched successfully", {
    orders,
    currentPage: page,
    totalPages: Math.ceil(totalOrders / limit),
    totalOrders,
  });
});

