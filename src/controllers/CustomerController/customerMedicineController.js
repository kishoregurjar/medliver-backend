const jwt = require("jsonwebtoken");
const medicineModel = require("../../modals/medicine.model");
const searchHistoryModel = require("../../modals/searchHishtory.model");
const { successRes } = require("../../services/response");
const CustomError = require("../../utils/customError");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const medicineClickHistoryModel = require("../../modals/medicineClickHistory.model");

module.exports.searchMedicine = asyncErrorHandler(async (req, res, next) => {
    const { query, page = 1 } = req.query;
    const limit = 30;
    const skip = (parseInt(page) - 1) * limit;

    if (!query) {
        return next(new CustomError("Search query is required", 400));
    }
    let token = req?.headers?.authorization;
    let userId = null;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            userId = decoded._id;
        } catch (err) {
            console.error("Invalid token:", err.message);
        }
    }

    if (userId) {
        searchHistoryModel.create({
            user_id: userId,
            keyword: query,
        });
    }

    const filter = {
        name: { $regex: query, $options: "i" }
    };

    const [medicines, totalCount] = await Promise.all([
        medicineModel.find(filter).skip(skip).limit(limit),
        medicineModel.countDocuments(filter),
    ]);

    return successRes(res, 200, true, "Medicines search results", {
        query,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalResults: totalCount,
        data: medicines,
    });
});

module.exports.logMedicineClick = asyncErrorHandler(async (req, res, next) => {
    const token = req?.headers?.authorization

    if (!token) {
        return next(new CustomError("Authorization token missing", 401));
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
        return next(new CustomError("Invalid or expired token", 401));
    }

    const userId = decoded._id;
    const { medicineId } = req.body;

    if (!medicineId) {
        return next(new CustomError("Medicine ID is required", 400));
    }

    await medicineClickHistoryModel.create({
        user_id: userId,
        medicine_id: medicineId,
    });

    return successRes(res, 200, true, "Click logged successfully");
});

module.exports.getUserTopPicksWithSimilar = asyncErrorHandler(async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return next(new CustomError("Authorization token missing", 401));
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
        return next(new CustomError("Invalid or expired token", 401));
    }

    const userId = decoded._id;

    const clickHistory = await medicineClickHistoryModel
        .find({ user_id: userId })
        .limit(5);

    const medicineIds = clickHistory.map(item => item.medicine_id);

    if (medicineIds.length === 0) {
        return successRes(res, 200, true, "No clicks found for user", []);
    }

    const topPicks = await medicineModel.find({ _id: { $in: medicineIds } });

    // Enhance each top pick with similar medicines
    const enrichedTopPicks = await Promise.all(
        topPicks.map(async (medicine) => {
            const similar = await medicineModel.find({
                short_composition1: medicine.short_composition1,
                _id: { $ne: medicine._id }
            }).limit(5);

            return {
                ...medicine.toObject(),
                similarMedicines: similar
            };
        })
    );

    return successRes(res, 200, true, "Top picks with similar medicines", enrichedTopPicks);
});