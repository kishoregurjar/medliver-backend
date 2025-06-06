const TestModel = require("../../modals/test.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const mongoose = require("mongoose");
const PathologyCenter = require("../../modals/pathology.model");
const moment = require("moment");
const OrderPathologyModel = require("../../modals/orderPathologyModel");

module.exports.searchTest = asyncErrorHandler(async (req, res, next) => {
  let { query } = req.query;

  if (!query) {
    return next(new CustomError("Search value is required", 400));
  }

  const regex = new RegExp(query.trim(), "i");

  const searchQuery = {
    name: regex,
    available: true,
  };

  const allTests = await TestModel.find(searchQuery).sort({ createdAt: -1 });

  if (allTests.length === 0) {
    return successRes(res, 200, false, "No Tests Found", []);
  }

  return successRes(res, 200, true, "Tests fetched successfully", allTests);
});

module.exports.testList = asyncErrorHandler(async (req, res, next) => {
  let { page, limit } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;
  const filter = { available: true };

  const [totalTests, allTests] = await Promise.all([
    TestModel.countDocuments(filter),
    TestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  if (allTests.length === 0) {
    return successRes(res, 200, false, "No Tests Found", []);
  }

  return successRes(res, 200, true, "Tests fetched successfully", {
    tests: allTests,
    currentPage: page,
    totalPages: Math.ceil(totalTests / limit),
    totalTests,
  });
});

module.exports.addTestToStock = asyncErrorHandler(async (req, res, next) => {
  const { testId, price, deliveryTime, availabilityAtHome, available } =
    req.body;
  const admin = req.admin;

  const pathology = await PathologyCenter.findOne({ adminId: admin._id });
  if (!pathology) {
    return next(new CustomError("Pathology not found", 404));
  }

  const test = await TestModel.findById(testId);
  if (!test) {
    return next(new CustomError("Test not found", 404));
  }

  const index = pathology.availableTests.findIndex(
    (t) => t.testId.toString() === testId
  );

  if (index !== -1) {
    return next(new CustomError("Test already added to Pathology Center", 400));
  }

  const newTest = {
    testId,
    price,
    deliveryTime,
    availabilityAtHome,
    available,
  };

  pathology.availableTests.push(newTest);
  await pathology.save();

  const populatedTest = {
    testId: {
      _id: test._id,
      name: test.name,
      description: test.description,
    },
    price,
    deliveryTime,
    availabilityAtHome,
    available,
  };
  return successRes(res, 200, true, "Test added successfully", populatedTest);
});

module.exports.getAvailableTestsForPathology = asyncErrorHandler(
  async (req, res, next) => {
    const admin = req.admin;

    const pathology = await PathologyCenter.findOne({ adminId: admin._id })
      .select("availableTests")
      .populate("availableTests.testId");

    if (!pathology) {
      return errorRes(res, 404, false, "Pathology Center not found");
    }

    return successRes(
      res,
      200,
      true,
      "Available tests fetched successfully",
      pathology
    );
  }
);

module.exports.updateTest = asyncErrorHandler(async (req, res, next) => {
  const admin = req.admin;
  const { testId, price, deliveryTime, availabilityAtHome, available } =
    req.body;

  if (!testId) {
    return next(new CustomError("testId is required", 400));
  }

  const pathology = await PathologyCenter.findOne({ adminId: admin._id });
  if (!pathology) {
    return next(new CustomError("Pathology not found", 404));
  }

  const testIndex = pathology.availableTests.findIndex((t) => {
    return t.testId.toString() === testId;
  });
  console.log("test id ", testIndex);

  if (testIndex === -1) {
    return next(new CustomError("Test not found in pathology center", 404));
  }

  if (price !== undefined) pathology.availableTests[testIndex].price = price;
  if (deliveryTime !== undefined || deliveryTime !== null)
    pathology.availableTests[testIndex].deliveryTime = deliveryTime;
  if (availabilityAtHome !== undefined || availabilityAtHome !== null)
    pathology.availableTests[testIndex].availabilityAtHome = availabilityAtHome;

  if (available !== undefined || available !== null)
    pathology.availableTests[testIndex].available = available;

  await pathology.save();

  return successRes(
    res,
    200,
    true,
    "Test updated successfully",
    pathology.availableTests[testIndex]
  );
});

module.exports.removeTestFromStock = asyncErrorHandler(
  async (req, res, next) => {
    const admin = req.admin;
    const { testId } = req.query;
    ``;

    if (!testId) {
      return next(new CustomError("testId is required", 400));
    }

    const pathology = await PathologyCenter.findOne({ adminId: admin._id });
    if (!pathology) {
      return next(new CustomError("Pathology not found", 404));
    }

    const testIndex = pathology.availableTests.findIndex((t) => {
      return t.testId.toString() === testId;
    });
    console.log("test id ", testIndex);

    if (testIndex === -1) {
      return next(new CustomError("Test not found in pathology center", 404));
    }
    const testRemove = pathology.availableTests[testIndex];

    pathology.availableTests.splice(testIndex, 1);
    await pathology.save();

    return successRes(res, 200, true, "Test remove successfully", testRemove);
  }
);

module.exports.getSingleTestInfo = asyncErrorHandler(async (req, res, next) => {
  const admin = req.admin;
  const { testId } = req.query;

  if (!testId) {
    return next(new CustomError("Test ID is required", 400));
  }

  const pathology = await PathologyCenter.findOne({
    adminId: admin._id,
  }).populate({
    path: "availableTests.testId",
    model: "Test",
  });

  if (!pathology) {
    return next(new CustomError("Pathology center not found", 404));
  }

  const matchedTest = pathology.availableTests.find((t) => {
    return t.testId && t.testId._id.toString() === testId;
  });

  if (!matchedTest) {
    return next(new CustomError("Test not found in pathology center", 404));
  }

  return successRes(res, 200, true, "Test fetched successfully", matchedTest);
});

module.exports.searchTestInMyStock = asyncErrorHandler(
  async (req, res, next) => {
    const admin = req.admin;
    const { query } = req.query;

    if (!query) {
      return next(new CustomError("Search value is required", 400));
    }

    const pathology = await PathologyCenter.findOne({
      adminId: admin._id,
    }).populate("availableTests.testId");

    if (!pathology) {
      return next(new CustomError("Pathology center not found", 404));
    }

    const testIdsInStock = pathology.availableTests.map((t) => t.testId);
    const regex = new RegExp(query.trim(), "i");
    const matchingResult = pathology.availableTests.filter((test) => {
      const testName = test.testId.name;
      const testPrice = test.price;
      const result = testName.match(regex) || testPrice.toString().match(regex);
      return result;
    });

    if (matchingResult.length === 0) {
      return successRes(
        res,
        200,
        false,
        "No matching tests found in your stock",
        []
      );
    }

    return successRes(res, 200, true, "Matching tests fetched", matchingResult);
  }
);

module.exports.changeTestStatus = asyncErrorHandler(async (req, res, next) => {
  const { testId, available } = req.body;
  const admin = req.admin;

  if (!testId) {
    return next(new CustomError("testId is required", 400));
  }

  const pathology = await PathologyCenter.findOne({ adminId: admin._id });
  if (!pathology) {
    return next(new CustomError("Pathology center not found", 404));
  }

  const index = pathology.availableTests.findIndex(
    (t) => t.testId.toString() === testId
  );

  if (index === -1) {
    return next(
      new CustomError("Test does not belong to your pathology center", 403)
    );
  }

  pathology.availableTests[index].available = available;

  await pathology.save();

  return successRes(res, 200, true, "Test availability changed successfully", {
    available: pathology.availableTests[index].available,
  });
});

module.exports.getDashboardStatus = asyncErrorHandler(
  async (req, res, next) => {
    const admin = req.admin;

    const pathology = await PathologyCenter.findOne({ adminId: admin._id });

    if (!pathology) return next(new CustomError("Pathology not found", 404));

    const total = pathology.availableTests.length;

    const available = pathology.availableTests.filter(
      (test) => test.available
    ).length;

    const unavailable = total - available;

    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();

    const monthlyInsight = await OrderPathologyModel.countDocuments({
      pathologyCenterId: pathology._id,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });
    //   const latestDoc = await OrderPathologyModel.findOne({
    //   createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    // }).sort({ createdAt: -1 });

    return successRes(res, 200, true, "Stats fetched", {
      total,
      available,
      unavailable,
      monthlyInsight,
    });
  }
);
