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
        pathologyCenterId: assignedCenter?._id || null,
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


// module.exports.getTestsByCategory = asyncErrorHandler(async (req, res, next) => {
//   const categories = await TestCategory.find()
//     .populate({
//       path: "tests",
//       match: { available: true }, 
//       select: "name price description image_url", 
//     })
//     .select("name description image_url tests");

//   if (!categories || categories.length === 0) {
//     return successRes(res, 200, false, "No categories found", []);
//   }

//   return successRes(res, 200, true, "Tests grouped by category fetched successfully", {
//     categories,
//   });
// });

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
