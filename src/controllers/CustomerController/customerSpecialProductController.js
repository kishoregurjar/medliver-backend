const customerModel = require("../../modals/customer.model");
const CustomError = require("../../utils/customError");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const FeaturedProduct = require("../../modals/featuredProduct.model");
const BestSellerModel = require("../../modals/bestSeller.model");
const specialOfferModel = require("../../modals/specialOffer.model");

module.exports.getAllFeaturedProducts = asyncErrorHandler(async (req, res, next) => {
    let { page, limit, sortOrder } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const sortDir = sortOrder?.toLowerCase() === "asc" ? 1 : -1; // Default to descending order

    const [totalFeaturedProducts, featuredProducts] = await Promise.all([
        FeaturedProduct.countDocuments({ isActive: true }),
        FeaturedProduct.find({ isActive: true })
            .populate("product")
            .sort({ featuredAt: sortDir })
            .skip(skip)
            .limit(limit),
    ]);

    if (!featuredProducts || featuredProducts.length === 0) {
        return successRes(res, 200, false, "No featured products found", []);
    }

    // 🔄 Flatten the product object and rename _id to medicineId
    const flattenedProducts = featuredProducts.map(item => {
        const product = item.product?.toObject?.() || {};
        return {
            ...product,
            medicineId: product._id,
            featuredAt: item.featuredAt
        };
    });

    return successRes(res, 200, true, "Featured products fetched successfully", {
        featuredProducts: flattenedProducts,
        totalFeaturedProducts,
        currentPage: page,
        totalPages: Math.ceil(totalFeaturedProducts / limit),
    });
});

module.exports.getAllSellingProduct = asyncErrorHandler(async (req, res, next) => {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const adminProducts = await BestSellerModel.find({
        isActive: true,
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

    // 🔄 Flatten the data and rename _id to medicineId
    const flattenedProducts = combinedResults.map(item => {
        const product = item.product?.toObject?.() || {};
        return {
            ...product,
            medicineId: product._id,
            soldCount: item.soldCount
        };
    });

    const total = await BestSellerModel.countDocuments({
        isActive: true
    });

    return successRes(res, 200, true, "Best selling products fetched successfully", {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        products: flattenedProducts
    });
});

module.exports.getallSpecialOffers = asyncErrorHandler(
    async (req, res, next) => {
        let { page, limit, sortOrder } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;

        const sortDir = sortOrder?.toLowerCase() === "asc" ? 1 : -1;

        const [totalSpecialOffers, specialOffers] = await Promise.all([
            specialOfferModel.countDocuments(),
            specialOfferModel
                .find()
                .populate("product", "name image price")
                .sort({ createdAt: sortDir })
                .skip(skip)
                .limit(limit),
        ]);

        if (!specialOffers || specialOffers.length === 0) {
            return successRes(res, 200, false, "No special offers found", []);
        }

        // 🔄 Flatten the product and rename _id to medicineId
        const flattenedOffers = specialOffers.map(item => {
            const product = item.product?.toObject?.() || {};
            return {
                ...product,
                medicineId: product._id,
                offerId: item._id, // optional: include special offer id if needed
                createdAt: item.createdAt, // optional: include other offer-specific fields
                updatedAt: item.updatedAt
            };
        });

        return successRes(res, 200, true, "Special offers fetched successfully", {
            specialOffers: flattenedOffers,
            totalSpecialOffers,
            currentPage: page,
            totalPages: Math.ceil(totalSpecialOffers / limit),
        });
    }
);
