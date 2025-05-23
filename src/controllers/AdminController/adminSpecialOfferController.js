const specialOfferModel = require("../../modals/specialOffer.model");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const medicineModel = require("../../modals/medicine.model");
const CustomError = require("../../utils/customError");
const { successRes } = require("../../services/response");
const { default: mongoose } = require("mongoose");

module.exports.createSpecialOffer = asyncErrorHandler(
  async (req, res, next) => {
    const { product, offerPercentage, validTill } = req.body;
    if (!product || !offerPercentage || !validTill) {
      return next(new CustomError("All fields are required", 400));
    }

    if(offerPercentage < 0 || offerPercentage > 100){
      return next(new CustomError("Offer percentage must be between 0 and 100", 400));
    }
    if(mongoose.Types.ObjectId.isValid(product) === false){
      return next(new CustomError("Invalid product ID", 400));
    }
    const medicine = await medicineModel.findById(product);
    if (!medicine) {
      return next(new CustomError("Product not found", 404));
    }
    const originalPrice = medicine.price;

    const offerPrice = originalPrice - (originalPrice * offerPercentage) / 100;
    if (offerPrice < 0) {
      return next(new CustomError("Offer price cannot be negative", 400));
    }
    const specialOffer = await specialOfferModel.create({
      product,
      offerPrice: offerPrice.toFixed(2),
      originalPrice: originalPrice.toFixed(2),
      offerPercentage,
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
    const { specialOfferId, offerPercentage } = req.body;

    if (!specialOfferId || !offerPercentage) {
        return next(new CustomError("Special offer ID and offer price is required", 400));
    }

    if (offerPercentage < 0 || offerPercentage > 100) {
        return next(new CustomError("Offer percentage must be between 0 and 100", 400));
    }

    const specialOff = await specialOfferModel.findById(specialOfferId);
    if (!specialOff) {
        return next(new CustomError("Special offer not found", 404));
    }

    const originalPrice = specialOff.originalPrice;
    const offerPrice = originalPrice - (originalPrice * offerPercentage) / 100;
    if (offerPrice < 0) {
        return next(new CustomError("Offer price cannot be negative", 400));
    }
    const specialOffer = await specialOfferModel.findByIdAndUpdate(
        specialOfferId,
        { $set: { offerPrice , offerPercentage} },
        { new: true }
    );

    if (!specialOffer) {
        return next(new CustomError("Special offer not found", 404));
    }

    return successRes(res, 200, true, "Special offer updated successfully", specialOffer);
});


module.exports.activeDeactiveSpecialOffer = asyncErrorHandler(async (req, res, next) => {
    const { specialOfferId, isActive } = req.body;
    if (!specialOfferId || isActive === undefined) {
        return next(new CustomError("Special offer ID and isActive status are required", 400));
    }

    const specialOffer = await specialOfferModel.findByIdAndUpdate(
        specialOfferId,
        { $set: { isActive } },
        { new: true }
    );

    if (!specialOffer) {
        return next(new CustomError("Special offer not found", 404));
    }

    return successRes(res, 200, true, "Special offer status updated successfully", specialOffer);
});

// module.exports.searchSpecialOffers = asyncErrorHandler(async (req, res, next) => {
//   let { query } = req.query;

//   if (!query) {
//     return next(new CustomError("Search value is required", 400));
//   }

//   const regex = new RegExp(query.trim(), "i");

//   const offers = await specialOfferModel
//     .find()
//     .populate("product", "name image price")
//     .sort({ createdAt: -1 });

//   const filteredOffers = offers.filter((offer) =>
//     regex.test(offer.product?.name || "")
//   );

//   if (filteredOffers.length === 0) {
//     return successRes(res, 200, false, "No Special Offers Found", []);
//   }

//   return successRes(res, 200, true, "Special Offers fetched successfully", filteredOffers);
// });

module.exports.searchSpecialOffers = asyncErrorHandler(async (req, res, next) => {
  let { query, page, limit } = req.query;

  if (!query) {
    return next(new CustomError("Search value is required", 400));
  }

  const regex = new RegExp(query.trim(), "i");
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;
  const skip = (page - 1) * limit;

  const offers = await specialOfferModel
    .find()
    .populate("product", "name image price")
    .sort({ createdAt: -1 });

  const filteredOffers = offers.filter((offer) =>
    regex.test(offer.product?.name || "")
  );

  const totalResults = filteredOffers.length;
  const paginatedResults = filteredOffers.slice(skip, skip + limit);

  if (paginatedResults.length === 0) {
    return successRes(res, 200, false, "No Special Offers Found", []);
  }

  return successRes(res, 200, true, "Special Offers fetched successfully", {
    specialOffers: paginatedResults,
    totalResults,
    currentPage: page,
    totalPages: Math.ceil(totalResults / limit),
  });
});
