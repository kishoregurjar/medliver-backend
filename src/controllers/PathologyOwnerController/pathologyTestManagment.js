const TestModel = require('../../modals/test.model');
const { successRes } = require('../../services/response');
const asyncErrorHandler = require('../../utils/asyncErrorHandler');
const CustomError = require('../../utils/customError');
const mongoose = require("mongoose");
const PathologyCenter = require('../../modals/pathology.model');

module.exports.searchTest = asyncErrorHandler(async (req, res, next) => {
  let { query } = req.query;

  if (!query) {
    return next(new CustomError("Search value is required", 400));
  }

  const regex = new RegExp(query.trim(), 'i');

  const searchQuery = {
    name: regex,
    available: true
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
    TestModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  if (allTests.length === 0) {
    return successRes(res, 200, false, "No Tests Found", []);
  }

  return successRes(res, 200, true, "Tests fetched successfully", {
    tests: allTests,
    currentPage: page,
    totalPages: Math.ceil(totalTests / limit),
    totalTests
  });
});

module.exports.addTestToStock = asyncErrorHandler(async (req, res, next) => {
  const { testId,price,deliveryTime, availabilityAtHome} = req.body;
    const admin = req.admin;
  
    const pathology = await PathologyCenter.findOne({ adminId: admin._id });
    const pathologyCenterId = pathology._id;

     console.log("pathology id",pathologyCenterId)
      if (!pathologyCenterId) {
        return errorRes(res, 404, false, "Pathology not found");
      }

     if (testId === undefined  || price === undefined|| deliveryTime=== undefined || availabilityAtHome=== undefined) {
    return next(new CustomError("All fields are required",400));
   }
 
  const test = await TestModel.findById(testId);
  if (!test) {
    return next(new CustomError("Test not found", 404));
  }

  const pathologyCenter = await PathologyCenter.findById(pathologyCenterId);
  if (!pathologyCenter) {
    return next(new CustomError("Pathology Center not found", 404));
  }

  if (pathologyCenter.availableTests.includes(testId)) {
    return successRes(res, 200, true, "Test already added to Pathology Center", pathologyCenter);
  }

  pathologyCenter.availableTests.push({testId:testId,price:price,deliveryTime:deliveryTime,availabilityAtHome:availabilityAtHome});
  await pathologyCenter.save();

  return successRes(res, 200, true, "Test added to Pathology Center successfully", pathologyCenter);
});

module.exports.getAvailableTestsForPathology = asyncErrorHandler(async (req, res, next) => {
  const admin = req.admin;

  const pathology = await PathologyCenter.findOne({ adminId: admin._id }).select('availableTests').populate("availableTests.testId");
   

  if (!pathology) {
    return errorRes(res, 404, false, "Pathology Center not found");
  }

  return successRes(res, 200, true, "Available tests fetched successfully", pathology);
});

