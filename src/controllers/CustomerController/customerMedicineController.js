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
    let topPicks = [];
    if (!token) {
        topPicks = await medicineModel.aggregate([{ $sample: { size: 10 } }]);
        return successRes(res, 200, true, "Showing random top picks", topPicks);
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
        // No click history, return 10 random medicines
        topPicks = await medicineModel.aggregate([{ $sample: { size: 10 } }]);

        return successRes(res, 200, true, "Showing random top picks", topPicks);
    }

    topPicks = await medicineModel.find({ _id: { $in: medicineIds } });

    let allMedicinesMap = new Map();

    // Add top picks
    topPicks.forEach(med => {
        allMedicinesMap.set(med._id.toString(), med.toObject());
    });

    // Add similar medicines
    for (const medicine of topPicks) {
        const similar = await medicineModel.find({
            short_composition1: medicine.short_composition1,
            _id: { $ne: medicine._id }
        }).limit(5);

        similar.forEach(sim => {
            allMedicinesMap.set(sim._id.toString(), sim.toObject());
        });
    }

    const flattenedMedicines = Array.from(allMedicinesMap.values());

    return successRes(res, 200, true, "Top picks with similar medicines", flattenedMedicines);
});

module.exports.getMedicinesByManufacturer = asyncErrorHandler(async (req, res, next) => {
    const { medicineId, page = 1, limit = 10 } = req.query;

    if (!medicineId) {
        return next(new CustomError("medicineId is required", 400));
    }

    const medicine = await medicineModel.findById(medicineId);

    if (!medicine) {
        return next(new CustomError("Medicine not found", 404));
    }

    const manufacturerName = medicine.manufacturer;

    // Pagination calculations
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const similarMedicines = await medicineModel.find({
        manufacturer: manufacturerName,
        _id: { $ne: medicine._id }
    })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await medicineModel.countDocuments({
        manufacturer: manufacturerName,
        _id: { $ne: medicine._id }
    });

    return successRes(res, 200, true, "Medicines with same manufacturer", {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        medicines: similarMedicines
    });
});
