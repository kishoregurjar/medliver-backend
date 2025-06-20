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
const { getDistance, generateOrderNumber } = require('../../utils/helper');
const testClickHistoryModel = require('../../modals/testClickHistory.model');
const jwt = require('jsonwebtoken');
const testModel = require('../../modals/test.model');
const sendFirebaseNotification = require('../../services/sendNotification');
const notificationEnum = require('../../services/notificationEnum');


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
  const existingTests = await TestModel.find({ _id: { $in: convertedTestIds } });
  if (existingTests.length !== convertedTestIds.length) {
    return next(new CustomError("Test not found", 400));
  }
  const allCenters = await pathologySchema.find({
    isActive: true,
    availabilityStatus: "available",
    deviceToken: { $ne: null },
    centerCoordinates: { $ne: null },
    // availableTests: {
    //   $elemMatch: {
    //     testId: { $in: convertedTestIds }
    //   }
    // }
  });

  console.log(allCenters, "allCenters");

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
    orderNumber: generateOrderNumber("test"),
    customerId: userId,
    pathologyCenterId: assignedCenter?._id || null,
    selectedTests: convertedTestIds.map(id => ({ testId: id })),
    totalAmount: assignedCenter ? assignedCenter.availableTests.price : 0,
    isHomeCollection: assignedCenter ? assignedCenter.availableTests.availabilityAtHome : false,
    paymentMethod: paymentMethod,
    addressId: deliveryAddressId,
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
    let notificationType = "pathology_order_request";
    let role = "pathology";
    let notificationRes = notificationEnum.getNotification(role, notificationType);

    notification = new notificationModel({
      title: notificationRes.title,
      message: notificationRes.message,
      recipientType: "pathology",
      notificationType: notificationType,
      NotificationTypeId: newOrder._id,
      recipientId: assignedCenter._id,
    })
    if (assignedCenter.deviceToken) {
      await sendFirebaseNotification(
        assignedCenter.deviceToken,
        notificationRes.title,
        notificationRes.message,
        notification
      )
    }
  } else {
    const admin = await adminSchema.findOne({ role: "superadmin" });

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
  const { categoryId, page = 1, limit = 10 } = req.query;

  if (!categoryId) {
    return next(new CustomError("Category ID is required", 400));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [category, totalTests, tests] = await Promise.all([
    TestCategory.findById(categoryId),
    TestModel.countDocuments({ categoryId }),
    TestModel.find({ categoryId })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }) // Optional: latest first
  ]);

  if (!category) {
    return next(new CustomError("Test category not found", 404));
  }

  // Step 3: Return combined response
  return successRes(res, 200, true, "Tests for this category fetched successfully", {
    category: {
      _id: category._id,
      name: category.name,
      description: category.description,
      image_url: category.image_url,
    },
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalTests / limit),
    totalTests,
    tests
  });
});

module.exports.getTestDetails = asyncErrorHandler(async (req, res, next) => {
  const { testId } = req.query;

  const test = await TestModel.findById(testId).populate("categoryId");

  if (!test) {
    return next(new CustomError("Test not found", 404));
  }

  return successRes(res, 200, true, "Test details fetched successfully", test);
});

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

module.exports.getOrdersPathology = asyncErrorHandler(async (req, res, next) => {
  const customerId = req.user._id;

  // Get page and limit from query, set defaults
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination info
  const totalOrders = await orderPathologyModel.countDocuments({ customerId });

  const orders = await orderPathologyModel.find({ customerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("selectedTests", "name price")
    .populate("pathologyCenterId")
    .populate("customerId");

  // const formattedOrders = orders.map(order => ({
  //   _id: order._id,
  //   customer: order.customerId,
  //   pathologyCenter: order.pathologyCenterId,
  //   selectedTests: order.selectedTests,
  //   isHomeCollection: order.isHomeCollection,
  //   orderStatus: order.orderStatus,
  //   reportStatus: order.reportStatus,
  //   paymentStatus: order.paymentStatus,
  //   paymentMethod: order.paymentMethod,
  //   pathologyAttempts: order.pathologyAttempts,
  //   orderDate: order.orderDate,
  //   cancellationReason: order.cancellationReason,
  // }));

  return successRes(res, 200, true, "Customer pathology orders fetched successfully", {
    orders,
    totalOrders,
    currentPage: Number(page),
    totalPages: Math.ceil(totalOrders / limit),
  });
});


module.exports.getOrderDetailsPathology = asyncErrorHandler(async (req, res, next) => {
  const customerId = req.user._id;
  const { orderId } = req.query;

  if (!orderId) {
    return next(new CustomError("Order ID is required", 400));
  }

  const order = await orderPathologyModel
    .findOne({ _id: orderId, customerId })
    .populate("selectedTests.testId", "name price")
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
      { orderNumber: regex },
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

module.exports.logTestClick = asyncErrorHandler(async (req, res, next) => {
  const token = req?.headers?.authorization

  if (!token) {
    return next(new CustomError("Authorization token missing", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    return next(new CustomError(err.message, 401));
  }

  const userId = decoded._id;
  const { testId } = req.body;

  if (!testId) {
    return next(new CustomError("Test ID is required", 400));
  }

  await testClickHistoryModel.create({
    user_id: userId,
    test_id: testId,
  });

  return successRes(res, 200, true, "Click logged successfully");
});

module.exports.getLogHistoryTest = asyncErrorHandler(async (req, res, next) => {
  const token = req.headers.authorization;
  let topPicks = [];

  // If no token, show random top picks
  if (!token) {
    topPicks = await testModel.aggregate([{ $sample: { size: 10 } }]);
    return successRes(res, 200, true, "Showing random top picks", topPicks);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    return next(new CustomError("Invalid or expired token", 401));
  }

  const userId = decoded._id;

  // Get user's recent click history
  const clickHistory = await testClickHistoryModel
    .find({ user_id: userId }, { test_id: 1 })
    .sort({ createdAt: -1 }) // optional: prioritize recent
    .limit(5)
    .lean();

  const testIds = clickHistory.map(item => item.test_id);

  if (testIds.length === 0) {
    const randomTopPicks = await testModel.aggregate([{ $sample: { size: 10 } }]);
    return successRes(res, 200, true, "Showing random top picks", randomTopPicks);
  }

  // Fetch top picked tests
  const topPickedTests = await testModel.find({ _id: { $in: testIds } }).lean();

  const categoryIds = topPickedTests.map(t => t.categoryId);

  // Fetch similar tests from same categories, excluding the already picked ones
  const similarTests = await testModel.find({
    categoryId: { $in: categoryIds },
    _id: { $nin: testIds }
  }).limit(20).lean();

  // Merge and de-duplicate
  const testMap = new Map();

  topPickedTests.forEach(test => testMap.set(test._id.toString(), test));
  similarTests.forEach(test => testMap.set(test._id.toString(), test));

  const combinedResults = Array.from(testMap.values());

  return successRes(res, 200, true, "Top picks with similar medicines", combinedResults);
});

module.exports.getAllTestCategory = asyncErrorHandler(async (req, res, next) => {
  let { page, limit, sortOrder } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const sortDir = sortOrder?.toLowerCase() === "asc" ? 1 : -1;

  const [totalCategories, categories] = await Promise.all([
    TestCategory.countDocuments(),
    TestCategory.find()
      .sort({ created_at: sortDir })
      .skip(skip)
      .limit(limit),
  ]);

  if (!categories || categories.length === 0) {
    return successRes(res, 200, false, "No test categories found", []);
  }

  return successRes(res, 200, true, "Test categories fetched successfully", {
    categories,
    totalCategories,
    currentPage: page,
    totalPages: Math.ceil(totalCategories / limit),
  });
});
