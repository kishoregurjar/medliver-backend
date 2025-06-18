const Stock = require('../modals/stock.model')
const Pharmacy = require("../modals/pharmacy.model")
const Medicine = require('../modals/medicine.model')
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/customError")
const { successRes } = require('../services/response');


module.exports.createStock = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;
  const pharmacyId = await Pharmacy.findOne({ adminId });

  if (!pharmacyId) {
    return next(new CustomError("Pharmacy not found", 404));
  }
  const { medicines } = req.body;

  if (medicines.length === 0) {
    return next(new CustomError("medicines are required", 400));
  }
  const createdStocks = [];
  for (const item of medicines) {
    const { medicineId, quantity = 0, price, discount = 0 } = item;

    if (!medicineId || price === undefined) {
      return next(new CustomError("Each medicine must have a medicineId and price", 400));
    }

    const existingStock = await Stock.findOne({
      pharmacyId,
      medicineId,
    });

    if (existingStock) {
      return next(new CustomError(`Stock already exists for medicineId: ${medicineId}`, 409));
    }

    const newStock = await Stock.create({
      pharmacyId,
      medicineId,
      quantity,
      price,
      discount,
    });
    createdStocks.push(newStock)
  }

  return successRes(res, 201, true, "Stock created successfully", createdStocks);
});

module.exports.getStockByPharmacyId = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;
  const pharmacyId = await Pharmacy.findOne({ adminId });

  if (!pharmacyId) {
    return next(new CustomError("Pharmacy not found", 404));
  }

  const stocks = await Stock.find({ pharmacyId }).populate("medicineId");

  if (!stocks || stocks.length === 0) {
    return next(new CustomError("No stock found for the given pharmacyId", 404));
  }

  return successRes(res, 200, true, "Stock fetched successfully", stocks);
});

module.exports.getAllStock = asyncErrorHandler(async (req, res, next) => {
  let { page, limit } = req.query;

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const [totalStock, allStock] = await Promise.all([
    Stock.countDocuments(),
    Stock.find()
      .populate("medicineId")
      .populate("pharmacyId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  if (allStock.length === 0) {
    return successRes(res, 200, false, "No stock found", []);
  }

  return successRes(res, 200, true, "Stocks fetched successfully", {
    stocks: allStock,
    currentPage: page,
    totalPages: Math.ceil(totalStock / limit),
    totalStock
  });
});

module.exports.updateStock = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;
  const pharmacyId = await Pharmacy.findOne({ adminId });
  if (!pharmacyId) {
    return next(new CustomError("Pharmacy not found", 404));
  }
  const { medicineId, quantity, price, discount } = req.body;

  if (!pharmacyId || !medicineId) {
    return next(new CustomError("pharmacyId and medicineId are required", 400));
  }

  const updateFields = {};
  if (quantity !== undefined) updateFields.quantity = quantity;
  if (price !== undefined) updateFields.price = price;
  if (discount !== undefined) updateFields.discount = discount;

  if (Object.keys(updateFields).length === 0) {
    return next(new CustomError("No fields provided for update", 400));
  }

  const updatedStock = await Stock.findOneAndUpdate(
    { pharmacyId, medicineId },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!updatedStock) {
    return next(new CustomError("Stock not found", 404));
  }

  return successRes(res, 200, true, "Stock updated successfully", updatedStock);
});


module.exports.deleteStock = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;

  const pharmacy = await Pharmacy.findOne({ adminId });
  if (!pharmacy) {
    return next(new CustomError("Pharmacy not found", 404));
  }

  const { stockId } = req.query;
  if (!stockId) {
    return next(new CustomError("Stock Id is required", 400));
  }

  const stock = await Stock.findOne({ _id: stockId, pharmacyId: pharmacy._id });
  if (!stock) {
    return next(new CustomError('Stock not found or not owned by your pharmacy', 404));
  }

  await Stock.findByIdAndDelete(stockId);

  return successRes(res, 200, true, 'Stock deleted successfully.', stock);
});


module.exports.searchStock = asyncErrorHandler(async (req, res, next) => {
  const adminId = req.admin._id;
  let { query, page, limit } = req.query;

  if (!query) {
    return next(new CustomError("Search value is required", 400));
  }

  const pharmacy = await Pharmacy.findOne({ adminId });
  if (!pharmacy) {
    return next(new CustomError("Pharmacy not found", 404));
  }

  const regex = new RegExp(query.trim(), "i");
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  // First get all stocks for this pharmacy
  const allStocks = await Stock.find({ pharmacyId: pharmacy._id })
    .populate({
      path: "medicineId",
      select: "name manufacturer short_composition1 short_composition2"
    })
    .sort({ createdAt: -1 });

  // Filter stocks based on medicine details
  const filteredStocks = allStocks.filter((stock) => {
    const medicine = stock.medicineId;
    if (!medicine) return false;

    return (
      regex.test(medicine.name || "") ||
      regex.test(medicine.manufacturer || "") ||
      regex.test(medicine.short_composition1 || "") ||
      regex.test(medicine.short_composition2 || "")
    );
  });

  const totalResults = filteredStocks.length;
  const paginatedResults = filteredStocks.slice(skip, skip + limit);

  if (paginatedResults.length === 0) {
    return successRes(res, 200, false, "No matching medicines found", []);
  }

  return successRes(res, 200, true, "Medicines found successfully", {
    stocks: paginatedResults,
    totalResults,
    currentPage: page,
    totalPages: Math.ceil(totalResults / limit),
  });
});
