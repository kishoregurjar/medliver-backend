const BestSellerModel = require("../../modals/bestSeller.model");
const MedicineModel = require("../../modals/medicine.model");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");

module.exports.createBestSellingProduct = asyncErrorHandler(async (req, res, next) => {
    const { productId } = req.body;
    if (!productId) {
        return next(new CustomError("Product Id fields is required", 400));
    }
    const findProduct = await MedicineModel.findById(productId);
    if (!findProduct) {
        return next(new CustomError("Product not found", 404));
    }
    const bestSellingProduct = await BestSellerModel.create({
        product: productId,
        isCreatedByAdmin: true
    });
    if (!bestSellingProduct) {
        return next(new CustomError("Unable to create best selling product", 400));
    }
    return successRes(
        res,
        201,
        "Best selling product created successfully",
        bestSellingProduct
    );
})

module.exports.getAllBestSellingProduct = asyncErrorHandler(async (req, res, next) => {
    let { isActive,page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const adminProducts = await BestSellerModel.find({
        isActive,
        isCreatedByAdmin: true
    })
        .populate('product')
        .sort({ soldCount: -1 })
        .skip(skip)
        .limit(limit);

    const remainingLimit = limit - adminProducts.length;

    let nonAdminProducts = [];

    if (remainingLimit > 0) {
        const excludedIds = adminProducts.map(item => item._id);

        nonAdminProducts = await BestSellerModel.find({
            isActive: true,
            isCreatedByAdmin: false,
            _id: { $nin: excludedIds }
        })
            .populate('product')
            .sort({ soldCount: -1 })
            .limit(remainingLimit);
    }

    const combinedResults = [...adminProducts, ...nonAdminProducts];

    const total = await BestSellerModel.countDocuments({
        isActive
    });

    return successRes(res, 200, true, "Best selling products fetched successfully", {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        products: combinedResults
    });
});

module.exports.updateStatus = asyncErrorHandler(async (req, res, next) => {
    let { bestSellingProductId } = req.body;
    if (!bestSellingProductId) {
        return next(new CustomError("Product Id is required", 400))
    }
    let findProduct = await BestSellerModel.findById(bestSellingProductId);
    if (!findProduct) {
        return next(new CustomError("Best Seller Product Not Found", 404));
    }
    if (findProduct.isActive) {
        findProduct.isActive = false;
        await findProduct.save();
    } else {
        findProduct.isActive = true;
        await findProduct.save();
    }
    return successRes(res, 200, true, "Status Changed Successfully", findProduct.isActive)
});

module.exports.deleteBestSellingProduct = asyncErrorHandler(async (req, res, next) => {
    let { bestSellingProductId } = req.query;
    if (!bestSellingProductId) {
        return next(new CustomError("Product Id is required", 400));
    }
    let findProduct = await BestSellerModel.findById(bestSellingProductId);
    if (!findProduct) {
        return next(new CustomError("Best Selling Product Not Found"))
    }
    if (!findProduct.isCreatedByAdmin) {
        return next(new CustomError("Product is not created by Admin, can't delete", 400))
    }
    await findProduct.deleteOne();
    return successRes(res, 200, true, "Product deleted successfully", findProduct)
})

module.exports.getBestSellingProductById = asyncErrorHandler(async (req, res, next) => {
  const { bestSellingProductId } = req.query;

  if (!bestSellingProductId) {
    return next(new CustomError("Best Selling Product ID is required", 400));
  }

  const bestSeller = await BestSellerModel.findById(bestSellingProductId).populate("product");

  if (!bestSeller) {
    return next(new CustomError("Best Selling Product not found", 404));
  }

  return successRes(res, 200, true, "Best Selling Product fetched successfully", bestSeller);
});


module.exports.searchBestSellingProducts = asyncErrorHandler(async (req, res, next) => {
  let { query, page, limit } = req.query;

  if (!query) {
    return next(new CustomError("Search value is required", 400));
  }

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const regex = new RegExp(query.trim(), "i");

  const allBestSellers = await BestSellerModel.find({ isActive: true })
    .populate("product")
    .sort({ createdAt: -1 });

  const filtered = allBestSellers.filter((item) =>
    regex.test(item.product?.name || "") ||
    regex.test(item.product?.manufacturer || "") ||
    regex.test(item.isActive?.toString())
  );

  const totalResults = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);

  if (paginated.length === 0) {
    return successRes(res, 200, false, "No Best Selling Products Found", []);
  }

  return successRes(res, 200, true, "Best Selling Products fetched successfully", {
    products: paginated,
    currentPage: page,
    totalPages: Math.ceil(totalResults / limit),
    totalResults
  });
});
