const promoBannerSchema = require("../../modals/promoBannerSchema");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");


module.exports.createPromoBanner = asyncErrorHandler(async (req, res, next) => {
    let {
        bannerImageUrl,
        productId,
        path,
        type,
        title,
        description,
        startDate,
        endDate,
        isActive,
        priority,
        redirectUrl
    } = req.body;

    if (!bannerImageUrl || !productId || !path || !type || !title || !description) {
        return next(new CustomError("All required fields must be provided", 400));
    }

    const newBanner = new promoBannerSchema({
        bannerImageUrl,
        productId,
        path,
        type,
        title,
        description,
        startDate,
        endDate,
        isActive: isActive ?? true,
        priority: priority ?? 1,
        redirectUrl
    });

    await newBanner.save();
    return successRes(res, 200, true, "Banner created successfully", newBanner);
});

module.exports.getAllPromoBanners = asyncErrorHandler(async (req, res, next) => {
    let { isActive, type } = req.query;

    isActive = isActive !== undefined ? isActive === 'true' : true;

    const typeFilter = type ? [type] : ["medicine", "test"];

    const banners = await promoBannerSchema.find({
        isActive,
        type: { $in: typeFilter }
    }).sort({ priority: -1, createdAt: -1 });

    return successRes(res, 200, true, "Banners fetched successfully", banners);
});


module.exports.getPromoBannerById = asyncErrorHandler(async (req, res, next) => {
    const { bannerId } = req.query;
    if (!bannerId) {
        return next(new CustomError("bannerId is required", 400));
    }
    const banner = await promoBannerSchema.findById(bannerId);
    if (!banner) {
        return next(new CustomError("Banner not found", 404));
    }
    return successRes(res, 200, true, "Banner fetched successfully", banner);
});

module.exports.updatePromoBanner = asyncErrorHandler(async (req, res, next) => {
    const { bannerId } = req.query;
    if (!bannerId) {
        return next(new CustomError("bannerId is required", 400));
    }
    const banner = await promoBannerSchema.findById(bannerId);
    if (!banner) {
        return next(new CustomError("Banner not found", 404));
    }
    const updatedBanner = await promoBannerSchema.findByIdAndUpdate(bannerId, req.body, { new: true });
    return successRes(res, 200, true, "Banner updated successfully", updatedBanner);
});

module.exports.deletePromoBanner = asyncErrorHandler(async (req, res, next) => {
    const { bannerId } = req.query;
    if (!bannerId) {
        return next(new CustomError("bannerId is required", 400));
    }
    const banner = await promoBannerSchema.findById(bannerId);
    if (!banner) {
        return next(new CustomError("Banner not found", 404));
    }
    await promoBannerSchema.findByIdAndDelete(bannerId);
    return successRes(res, 200, true, "Banner deleted successfully");
});

module.exports.updatePromoBannerPriority = asyncErrorHandler(async (req, res, next) => {
    const { bannerId } = req.query;
    if (!bannerId) {
        return next(new CustomError("bannerId is required", 400));
    }
    const banner = await promoBannerSchema.findById(bannerId);
    if (!banner) {
        return next(new CustomError("Banner not found", 404));
    }
    const updatedBanner = await promoBannerSchema.findByIdAndUpdate(bannerId, req.body, { new: true });
    return successRes(res, 200, true, "Banner updated successfully", updatedBanner);
});

module.exports.updatePromoBannerStatus = asyncErrorHandler(async (req, res, next) => {
    const { bannerId } = req.query;
    let { isActive } = req.body;
    if (!bannerId) {
        return next(new CustomError("bannerId is required", 400));
    }
    const banner = await promoBannerSchema.findById(bannerId);
    if (!banner) {
        return next(new CustomError("Banner not found", 404));
    }
    isActive != isActive
    const updatedBanner = await promoBannerSchema.findByIdAndUpdate(bannerId, req.body, { new: true });
    return successRes(res, 200, true, "Banner updated successfully", updatedBanner);
});