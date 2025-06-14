const TestCategory = require("../../modals/testCategory");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError")
const { successRes } = require("../../services/response")
require('dotenv').config();
const TestModel = require('../../modals/test.model');
const mongoose = require("mongoose")


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
    return next(new CustomError("Tests should be an array of objects with test_id", 400));
  }

  const newCategory = await TestCategory.create({
    name: name.trim(),
    description,
    image_url,
    tests: tests || [],
  });

  const populatedCategory = await TestCategory.findById(newCategory._id)
    .populate("tests.test_id");

  return successRes(res, 201, true, "Test Category created successfully", populatedCategory);
});``

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
//     name: name.trim(),
//     description,
//     image_url,
//     tests,
//   });

//   const populatedCategory = await TestCategory.findById(newCategory._id).populate("tests");

//   return successRes(res, 201, true, "Test Category created successfully", populatedCategory);
// });

module.exports.getAllTestCategories = asyncErrorHandler(async (req, res, next) => {
  let { page, limit } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const [total, categories] = await Promise.all([
    TestCategory.countDocuments(),
    TestCategory.aggregate([
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'tests',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'tests'
        }
      }
    ])
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

  const categoryData = await TestCategory.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(testCatgId) }
      },
    {
      $lookup: {
        from: 'tests',
        localField: '_id',
        foreignField: 'categoryId',
        as: 'tests'
      }
    }
  ]);

  if (!categoryData.length) {
    return next(new CustomError("Category not found", 404));
  }

  return successRes(res, 200, true, "Category fetched successfully", categoryData[0]);
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
  console.log("category",category)
  if (!category) {
    return next(new CustomError("Test Category not found", 404));
  }

  if (!Array.isArray(category.tests)) {
    return next(new CustomError("No tests found in this category", 500));
  }
const isTestPresent = category.tests.findIndex(
  (item) => item.test_id && item.test_id.toString() === testId
);

  if (isTestPresent === -1) {
    return next(new CustomError("Test not found in this category", 404));
  }

  category.tests.splice(isTestPresent, 1);
  await category.save();

  const populateTest = await TestCategory.findById(testCatgId).populate('tests.test_id');

  return successRes(res, 200, true, "Test removed from category successfully", populateTest);
});

module.exports.searchTestCategory = asyncErrorHandler(async (req, res, next) => {
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
      { description: regex }
    ]
  };

  const [totalCategories, allCategories] = await Promise.all([
    TestCategory.countDocuments(searchQuery),
    TestCategory.find(searchQuery).populate('tests.test_id')
      // .populate("tests") 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  if (allCategories.length === 0) {
    return successRes(res, 200, false, "No Test Categories Found", []);
  }


  return successRes(res, 200, true, "Test Categories fetched successfully", {
    testCategories: allCategories,
    currentPage: page,
    totalPages: Math.ceil(totalCategories / limit),
    totalCategories,
  });
});
