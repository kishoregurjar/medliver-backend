const TestCategory = require("../../modals/testCategory");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError")
const { successRes } = require("../../services/response")
require('dotenv').config();
const mongoose = require("mongoose")

// module.exports.createTestCategory = asyncErrorHandler(async (req, res, next) => {
//   const { name, description, image_url, tests } = req.body;

//   if (!name) {
//     return next(new CustomError("Category name is required", 400));
//   }

//   const existing = await TestCategory.findOne({ name: name.trim() });
//   if (existing) {
//     return next(new CustomError("Category with this name already exists", 409));
//   }
//   if (tests && !Array.isArray(tests)) {
//     return next(new CustomError("Tests should be an array of IDs", 400));
//   }

//   const newCategory = await TestCategory.create({
//     name,
//     description,
//     image_url,
//     tests
//   });

//   return successRes(res, 201, true, "Test Category created successfully", newCategory);
// });
module.exports.createTestCategory = asyncErrorHandler(async (req, res, next) => {
  const { name, description, image_url, tests } = req.body;

  if (!name) {
    return next(new CustomError("Category name is required", 400));
  }

  const existing = await TestCategory.findOne({ name: name.trim() });
  if (existing) {
    return next(new CustomError("Category with this name already exists", 409));
  }

  if (tests && !Array.isArray(tests)) {
    return next(new CustomError("Tests should be an array of IDs", 400));
  }

  const newCategory = await TestCategory.create({
    name: name.trim(),
    description,
    image_url,
    tests,
  });

  const populatedCategory = await TestCategory.findById(newCategory._id).populate("tests");

  return successRes(res, 201, true, "Test Category created successfully", populatedCategory);
});


module.exports.getAllTestCategories = asyncErrorHandler(async (req, res, next) => {
  let { page, limit } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const [total, categories] = await Promise.all([
    TestCategory.countDocuments(),
    TestCategory.find()
      .populate("tests")
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 })
  ]);

  if (categories.length === 0) {
    return successRes(res, 200, false, "No categories found", []);
  }

  return successRes(res, 200, true, "Categories fetched successfully", {
    categories,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    total,
  });
});

module.exports.getTestCategoryById = asyncErrorHandler(async (req, res, next) => {
  const { testCatgId } = req.query;

  if (!testCatgId) {
    return next(new CustomError("Category ID is required", 400));
  }

  const category = await TestCategory.findById(testCatgId).populate("tests");
  if (!category) {
    return next(new CustomError("Category not found", 404));
  }

  return successRes(res, 200, true, "Category fetched successfully", category);
});


module.exports.updateTestCategory = asyncErrorHandler(async (req, res, next) => {
  const { testCatgId, name, description, image_url, tests } = req.body;

  if (!testCatgId) {
    return next(new CustomError("Category ID is required", 400));
  }

  const updateFields = {};
  if (name) updateFields.name = name;
  if (description) updateFields.description = description;
  if (image_url) updateFields.image_url = image_url;

  if (tests) {
    if (!Array.isArray(tests)) {
      return next(new CustomError("Tests should be an array of IDs", 400));
    }

    // Use $addToSet to add unique tests without duplicates, or use $push if duplicates are allowed
    updateFields.$addToSet = { tests: { $each: tests } };
  }

  updateFields.updated_at = new Date();

  const updatedCategory = await TestCategory.findByIdAndUpdate(
    testCatgId,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!updatedCategory) {
    return next(new CustomError("Test Category not found", 404));
  }

  return successRes(res, 200, true, "Test Category updated successfully", updatedCategory);
});

module.exports.deleteTestCategoryById = asyncErrorHandler(async (req, res, next) => {
  const { testCatgId } = req.query;

  if (!testCatgId) {
    return next(new CustomError("Category ID is required", 400));
  }

  const deleted = await TestCategory.findByIdAndDelete(testCatgId);
  if (!deleted) {
    return next(new CustomError("Category not found", 404));
  }

  return successRes(res, 200, true, "Category deleted successfully", deleted);
});

module.exports.uploadTestCatgImg = asyncErrorHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new CustomError("No file uploaded.", 400));
  }

  const imageUrl = `${process.env.UPLOAD_CATG_IMG}${req.file.filename}`;
  return successRes(res, 200, true, "File Uploaded Successfully", { imageUrl });

});

module.exports.removeTestFromCategory = asyncErrorHandler(async (req, res, next) => {
  const { testCatgId, testId } = req.body;

  if (!testCatgId || !testId) {
    return next(new CustomError("Both categoryId and testId are required", 400));
  }

  const category = await TestCategory.findById(testCatgId);
  if (!category) {
    return next(new CustomError("Test Category not found", 404));
  }

  const isTestPresent = category.tests.includes(testId);
  if (!isTestPresent) {
    return next(new CustomError("Test not found in this category", 404));
  }
  category.tests.pull(testId);
  await category.save();

  return successRes(res, 200, true, "Test removed from category successfully", category);
});
