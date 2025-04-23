const specialOfferModel = require("../../modals/specialOffer.model");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const { successRes } = require("../../services/response");

module.exports.createSpecialOffer = asyncErrorHandler(
  async (req, res, next) => {
    const { product, offerPrice, originalPrice, validTill } = req.body;
    if (!product || !offerPrice || !originalPrice || !validTill) {
      return next(new CustomError("All fields are required", 400));
    }
    const specialOffer = await specialOfferModel.create({
      product,
      offerPrice,
      originalPrice,
      validTill,
    });
    if (!specialOffer) {
      return next(new CustomError("Unable to create special offer", 400));
    }
    return successRes(
      res,
      201,
      "Special offer created successfully",
      specialOffer
    );
  }
);

module.exports.getAllSpecialOffers = asyncErrorHandler(
  async (req, res, next) => {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const [totalSpecialOffers, specialOffers] = await Promise.all([
      specialOfferModel.countDocuments(),
      specialOfferModel
        .find()
        .populate("product", "name image price")
        .limit(limit)
        .skip(skip),
    ]);

    if (!specialOffers || specialOffers.length === 0) {
      return successRes(res, 200, false, "No special offers found", []);
    }
    return successRes(res, 200, true, "Special offers fetched successfully", {
      specialOffers,
      totalSpecialOffers,
      currentPage: page,
      totalPages: Math.ceil(totalSpecialOffers / limit),
    });
  }
);



module.exports.getSpecialOfferById = asyncErrorHandler(async (req, res, next) => {
    const {specialOfferId} = req.query;
    if (!specialOfferId) {
        return next(new CustomError("Special offer ID is required", 400));
    }
    const specialOffer = await specialOfferModel.findById(specialOfferId).populate("product");
    if (!specialOffer) {
        return next(new CustomError("Special offer not found", 404));
    }
    return successRes(res, 200, true, "Special offer fetched successfully", specialOffer);
}  
)


module.exports.deleteSpecialOffer = asyncErrorHandler(async (req,res,next)=>{
    const {specialOfferId} = req.query;
    if (!specialOfferId) {
        return next(new CustomError("Special offer ID is required", 400));
    }
    const specialOffer = await specialOfferModel.findByIdAndDelete(specialOfferId);
    if (!specialOffer) {
        return next(new CustomError("Special offer not found", 404));
    }
    return successRes(res, 200, true, "Special offer deleted successfully", specialOffer);
})


module.exports.updateSpecialOffer = asyncErrorHandler(async (req, res, next) => {
    const { specialOfferId, offerPrice } = req.body;

    if (!specialOfferId || !offerPrice) {
        return next(new CustomError("Special offer ID and offer price is required", 400));
    }

    const specialOffer = await specialOfferModel.findByIdAndUpdate(
        specialOfferId,
        { $set: { offerPrice } },
        { new: true }
    );

    if (!specialOffer) {
        return next(new CustomError("Special offer not found", 404));
    }

    return successRes(res, 200, true, "Special offer updated successfully", specialOffer);
});
