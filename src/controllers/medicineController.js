const medicineModel = require("../modals/medicine.model");
const { successRes } = require("../services/response");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/customError");


const capitalizeWords = (str) => {
    return str
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
};

module.exports.createMedicine = asyncErrorHandler(async (req, res, next) => {
    let { name, price, manufacturer, packSizeLabel } = req.body;
    let adminId = req.admin._id;

    const regex = new RegExp(name, 'i');

    let findMedicine = await medicineModel.findOne({ name: { $regex: regex } });

    if (findMedicine) {
        return next(new CustomError("Medicine Already Present", 409));
    }

    const capitalizedName = capitalizeWords(name.toLowerCase());

    const newMedicine = await medicineModel.create({
        name: capitalizedName,
        price,
        manufacturer,
        packSizeLabel,
        createdBy: adminId,
    });

    return successRes(res, 201, true, "Medicine Created Successfully", newMedicine)
});

module.exports.updateMedicine = asyncErrorHandler(async (req, res, next) => {
    const { name, price, manufacturer, packSizeLabel, medicineId, description } = req.body;

    let medicine = await medicineModel.findById(medicineId);
    if (!medicine) {
        return next(new CustomError("Medicine not found", 404));
    }

    if (name) {
        medicine.name = capitalizeWords(name);
    }
    if (price !== undefined) {
        medicine.price = price;
    }
    if (manufacturer) {
        medicine.manufacturer = manufacturer;
    }
    if (packSizeLabel) {
        medicine.packSizeLabel = packSizeLabel;
    }
    if (description) {
        medicine.description = description;
    }

    await medicine.save();
    return successRes(res, 200, true, "Medicine updated successfully", medicine)

});

module.exports.getAllMedicines = asyncErrorHandler(async (req, res, next) => {
    let sort = req?.query?.sort === 'desc' ? -1 : 1; // default ascending
    let startFrom = req?.query?.startFrom || null;
    let page = parseInt(req.query.page) || 1;
    let limit = 30;
    let skip = (page - 1) * limit;

    let filter = {};

    if (startFrom) {
        filter.name = new RegExp('^' + startFrom, 'i');
    }

    const medicines = await medicineModel
        .find(filter)
        .sort({ name: sort })
        .skip(skip)
        .limit(limit);

    const totalCount = await medicineModel.countDocuments(filter);
    return successRes(res, 200, true, "Medicines fetched successfully", {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalMedicines: totalCount,
        data: medicines
    })
});

module.exports.getMedicineById = asyncErrorHandler(async (req, res, next) => {
    let { medicineId } = req.query;
    if (!medicineId) {
        return next(new CustomError("Medicine Id Required", 400))
    }
    let medicine = await medicineModel.findById(medicineId);
    if (!medicine) {
        return next(new CustomError("Medicines Not Found", 404))
    }
    return successRes(res, 200, true, "Medicine Details", medicine)
})

