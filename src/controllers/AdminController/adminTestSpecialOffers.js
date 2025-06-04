const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const  CustomError = require("../../utils/customError");
const testModel = require("../../modals/test.model");
const {successRes} = require("../../services/response");
const specialTestOfferMOdel = require("../../modals/specialTestOffer.model");

module.exports.createTestSpecialOffer = asyncErrorHandler(async (req, res, next) => {
    const {testId, validTill, offerPercentage} = req.body;

    if(!testId || !validTill || !offerPercentage){
        return next(new CustomError("All fields are required", 400));
    }

    if(offerPercentage < 0 || offerPercentage > 100){
        return next(new CustomError("Offer percentage must be between 0 and 100", 400));
    }

    const test =  await testModel.findById(testId);
    if(!test){
        return next(new CustomError("Test not found", 404));
    }

    let originalPrice = test.price;
    let offerPrice = originalPrice - (originalPrice * offerPercentage) / 100;

    if(offerPrice < 0){
        return next(new CustomError("Offer price cannot be negative", 400));
    }

    const specialTestOffer = await specialTestOfferMOdel.create({
        testId,
        offerPrice,
        offerPercentage,
        originalPrice,
        validTill,
        isActive: true
    });

    return successRes(res, 200, true, "Test special offer created successfully", {
        specialTestOffer
    })
});


module.exports.getSpecialTestOffer = asyncErrorHandler(async (req, res, next) => {
    let {page}  = req.query;

    page = parseInt(page) || 1;

    let limit  = 5;

    let skip = (page - 1) * limit;
    const [total, specialTestOffer] = await Promise.all([
        specialTestOfferMOdel.countDocuments({isActive: true}),
        specialTestOfferMOdel.find({isActive: true}).populate('testId').sort({createdAt: -1}).skip(skip).limit(limit)
    ])
   
    return successRes(res, 200, true, "Test special offer fetched successfully", {
        specialTestOffer,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
    })
});


module.exports.getSpecialTestOfferAdmin =  asyncErrorHandler(async (req, res, next) => {
    let {page}  = req.query;

    page = parseInt(page) || 1;

    let limit  = 10;

    let skip = (page - 1) * limit;
    const [total, specialTestOffer] = await Promise.all([
        specialTestOfferMOdel.countDocuments(),
        specialTestOfferMOdel.find().populate('testId').sort({createdAt: -1}).skip(skip).limit(limit)
    ])
   
    return successRes(res, 200, true, "Test special offer fetched successfully", {
        specialTestOffer,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total
    })
})


module.exports.getSpecialTestOfferById = asyncErrorHandler(async (req, res, next) => {
    const {specialTestOfferId} = req.query;

    if(!specialTestOfferId){
        return next(new CustomError("Special test offer id is required", 400));
    }

    const specialTestOffer = await specialTestOfferMOdel.findById(specialTestOfferId).populate('testId');

    return successRes(res, 200, true, "Special test offer fetched successfully", {
        specialTestOffer
    })
});

module.exports.updateSpecialTestOfferStatus = asyncErrorHandler(async (req, res, next) => {
    const {specialTestOfferId, status} = req.body;

    if(!specialTestOfferId ){
        return next(new CustomError("Special test offer id and status is required", 400));
    }

    const specialTestOffer = await specialTestOfferMOdel.findByIdAndUpdate(specialTestOfferId, {isActive: status}, {new: true});

    return successRes(res, 200, true, "Special test offer status updated successfully", {
        specialTestOffer
    });
});


module.exports.deleteSpecialTestOffer = asyncErrorHandler(async (req, res, next) => {
    const {specialTestOfferId} = req.query;

    if(!specialTestOfferId){
        return next(new CustomError("Special test offer id is required", 400));
    }

    const specialTestOffer = await specialTestOfferMOdel.findByIdAndDelete(specialTestOfferId);

    return successRes(res, 200, true, "Special test offer deleted successfully", {
        specialTestOffer
    });
});