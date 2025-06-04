const Test = require("../../modals/test.model");
const CustomError = require("../../utils/customError");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { successRes } = require("../../services/response");

const generateTestCode = async () => {
  const lastTest = await Test.findOne().sort({ createdAt: -1 });
  const lastCode = lastTest?.test_code?.split("_")[1] || "000";
  return `TEST_${String(Number(lastCode) + 1).padStart(3, "0")}`;
};

module.exports.createTest = asyncErrorHandler(async (req, res, next) => {
  const {
    name,
    description,
    price,
    sample_required,
    preparation,
    delivery_time,
    available_at_home,
    categoryId
  } = req.body;

  if (!name || !price) {
    return next(new CustomError("Name and Price are required", 400));
  }

  const existingTest = await Test.findOne({ name: name.trim(), price });
  if (existingTest) {
    return next(
      new CustomError("Test with same name and price already exists", 409)
    );
  }
  const test_code = await generateTestCode();
  const newTest = await Test.create({
    name,
    description,
    price,
    sample_required,
    preparation,
    delivery_time,
    test_code,
    available_at_home,
    categoryId
  });
  return successRes(res, 201, true, "Test created successfully", newTest);
});

module.exports.getAllTests = asyncErrorHandler(async (req, res, next) => {
  let { page, limit, sortOrder } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const sortDir = sortOrder?.toLowerCase() === "asc" ? 1 : -1; // default is descending

  const [total, tests] = await Promise.all([
    Test.countDocuments(),
    Test.find().sort({ createdAt: sortDir }).skip(skip).limit(limit),
  ]);

  if (tests.length === 0) {
    return successRes(res, 200, false, "No Tests Found", []);
  }

  return successRes(res, 200, true, "Tests fetched successfully", {
    tests,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    total,
  });
});

module.exports.getTestById = asyncErrorHandler(async (req, res, next) => {
  const { testId } = req.query;

  if (!testId) {
    return next(new CustomError("Test ID is required", 400));
  }

  const test = await Test.findById(testId);

  if (!test) {
    return next(new CustomError("Test not found", 404));
  }

  return successRes(res, 200, true, "Test fetched successfully", test);
});

module.exports.deleteTest = asyncErrorHandler(async (req, res, next) => {
  const { testId } = req.query;

  if (!testId) {
    return next(new CustomError("Test ID is required", 400));
  }

  const test = await Test.findByIdAndDelete(testId);

  if (!test) {
    return next(new CustomError("Test not found", 404));
  }

  return successRes(res, 200, true, "Test Deleted Successfully", test);
});

module.exports.updateTest = asyncErrorHandler(async (req, res, next) => {
  const { testId, name, price, sample_required, preparation, delivery_time, description, available_at_home, available } = req.body;

  if (!testId) {
    return next(new CustomError("Test ID is required", 400));
  }

  const updateFields = {};
  if (name) updateFields.name = name;
  if (price) updateFields.price = price;
  if (sample_required) updateFields.sample_required = sample_required;
  if (preparation) updateFields.preparation = preparation;
  if (delivery_time) updateFields.delivery_time = delivery_time;
  if (description) updateFields.description = description;
  if (available_at_home) updateFields.available_at_home = available_at_home;
  if (available) updateFields.available = available;

  if (Object.keys(updateFields).length === 0) {
    return next(new CustomError("No fields provided for update", 400));
  }

  const updatedTest = await Test.findByIdAndUpdate(
    testId,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!updatedTest) {
    return next(new CustomError("Test not found", 404));
  }

  return successRes(res, 200, true, "Test updated successfully", updatedTest);
});

module.exports.searchTest = asyncErrorHandler(async (req, res, next) => {
  let { value, page, limit } = req.query;

  if (!value) {
    return next(new CustomError("Search value is required", 400));
  }

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const regex = new RegExp(value.trim(), 'i');
  const searchQuery = {
    $or: [
      { name: regex },
    ]
  };

  const [totalTests, allTests] = await Promise.all([
    Test.countDocuments(searchQuery),
    Test.find(searchQuery)
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
