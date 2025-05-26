const FeaturedProduct = require("../../modals/featuredProduct.model");
const Medicine = require("../../modals/medicine.model");
const CustomError = require("../../utils/customError");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { successRes } = require("../../services/response");

module.exports.createFeaturedProduct = asyncErrorHandler(
  async (req, res, next) => {
    const { productId } = req.body;

    if (!productId) {
      return next(new CustomError("Medicine ID is required to feature", 400));
    }
    const medicine = await Medicine.findById(productId);
    if (!medicine) {
      return next(new CustomError("Medicine not found", 404));
    }
    const alreadyFeatured = await FeaturedProduct.findOne({
      product: productId,
    });
    if (alreadyFeatured) {
      return next(new CustomError("This medicine is already featured", 400));
    }
    const newFeaturedProduct = await FeaturedProduct.create({
      product: productId,
    });
    return successRes(
      res,
      201,
      true,
      "Medicine featured create successfully",
      newFeaturedProduct
    );
  }
);

module.exports.getAllFeaturedProducts = asyncErrorHandler(
  async (req, res, next) => {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const [totalFeaturedProducts, featuredProducts] = await Promise.all([
      FeaturedProduct.countDocuments(),
      FeaturedProduct.find().populate("product").limit(limit).skip(skip),
    ]);

    if (!featuredProducts || featuredProducts.length === 0) {
      return successRes(res, 200, false, "No featured products found", []);
    }

    return successRes(
      res,
      200,
      true,
      "Featured products fetched successfully",
      {
        featuredProducts,
        totalFeaturedProducts,
        currentPage: page,
        totalPages: Math.ceil(totalFeaturedProducts / limit),
      }
    );
  }
);

module.exports.deleteFeaturedProduct = asyncErrorHandler(
  async (req, res, next) => {
    const { productId } = req.query;

    if (!productId) {
      return next(new CustomError("Feature ID is required", 400));
    }

    const deleted = await FeaturedProduct.findOneAndDelete(productId);

    if (!deleted) {
      return next(new CustomError("Featured product not found", 404));
    }

    return successRes(
      res,
      200,
      true,
      "Featured product removed successfully",
      deleted
    );
  }
);

module.exports.getFeatureProductById = asyncErrorHandler(
  async (req, res, next) => {
    const { productId } = req.query;

    if (!productId) {
      return next(new CustomError("product ID id requires", 400));
    }

    const fethcData = await FeaturedProduct.findById(productId).populate("product");

    if (!fethcData) {
      return next(new CustomError("feature product is not found"), 404);
    }

    return successRes(res, 200, true, "Feature producd fetch successfully",fethcData);
  }
);

module.exports.updateFeaturedProductStatus = asyncErrorHandler(
  async (req, res, next) => {
    const { productId } = req.query;

    if (!productId) {
      return next(new CustomError("Featured product ID is required", 400));
    }

    const existingProduct = await FeaturedProduct.findById(productId);

    if (!existingProduct) {
      return next(new CustomError("Featured product not found", 404));
    }

    let newStatus;
    if (existingProduct.isActive === true) {
      newStatus = false;
    } else {
      newStatus = true;
    }

    const updatedProduct = await FeaturedProduct.findByIdAndUpdate(
      productId,
      { isActive: newStatus },
      { new: true }
    );

    return successRes(
      res,
      200,
      true,
      `Featured product has been ${
        newStatus ? "activated" : "deactivated"
      } successfully`,
      updatedProduct
    );
  }
);

 module.exports.searchFeaturedProducts = asyncErrorHandler(async (req, res, next) => {
  let { query, page, limit } = req.query;

  if (!query) {
    return next(new CustomError("Search value is required", 400));
  }

  const regex = new RegExp(query.trim(), "i");
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const featuredProducts = await FeaturedProduct.find()
    .populate("product")
    .sort({ createdAt: -1 });

  const filteredProducts = featuredProducts.filter((item) =>
    regex.test(item.product?.name || "") ||
    regex.test(item.product?.manufacturer || "") ||
    regex.test(item.isActive?.toString())
  );

  const totalResults = filteredProducts.length;
  const paginatedResults = filteredProducts.slice(skip, skip + limit);

  if (paginatedResults.length === 0) {
    return successRes(res, 200, false, "No Featured Products Found", []);
  }

  return successRes(res, 200, true, "Featured Products fetched successfully", {
    featuredProducts: paginatedResults,
    totalResults,
    currentPage: page,
    totalPages: Math.ceil(totalResults / limit),
  });
});
