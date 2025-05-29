const doctorSchema = require("../../modals/doctorSchema");
const { successRes } = require("../../services/response");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const doctorCategoryModel = require("../../modals/doctorCategory.model");

module.exports.createDoctorProfile = asyncErrorHandler(async (req, res, next) => {
    const {
        first_name,
        last_name,
        email,
        category_id,
        profile_image,
        qualifications,
        specialties,
        clinic_name,
        clinic_address,
        phone_number,
        available_at_home,
        consultation_fee,
        availability,
        experience,
        description
    } = req.body;

    if (!first_name || !last_name || !email || !category_id || !profile_image || !qualifications ||
        !specialties || !clinic_name || !clinic_address || !phone_number || !consultation_fee ||
        !experience || !description) {
        return next(new CustomError("Please provide all required fields.", 400));
    }

    const [categories, existingDoctor] = await Promise.all([
        doctorCategoryModel.find({ _id: { $in: category_id } }),
        doctorSchema.findOne({ $or: [{ email }, { phone_number }] })
    ]);

    if (categories.length !== category_id.length) {
        return next(new CustomError("One or more categories not found.", 404));
    }

    if (existingDoctor) {
        return next(new CustomError("A doctor with this email or phone number already exists.", 400));
    }

    const generatedPassword = crypto.randomBytes(8).toString("hex");
    console.log(generatedPassword, "password")

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);

    const categoryNames = categories.map(category => category.name);

    const doctorProfile = new doctorSchema({
        first_name,
        last_name,
        email,
        password: hashedPassword,
        category: categoryNames,
        category_id: category_id,
        profile_image,
        qualifications,
        specialties,
        clinic_name,
        clinic_address,
        phone_number,
        available_at_home,
        consultation_fee,
        availability,
        experience,
        description
    });

    await doctorProfile.save();

    return successRes(res, 201, true, "Doctor's Profile Created Successfully.", doctorProfile);
});

module.exports.getAllDoctorsList = asyncErrorHandler(async (req, res, next) => {
    let { page = 1, limit = 10, isActive } = req.query;
    isActive = isActive ? isActive : true;

    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page < 1) {
        return next(new CustomError("Invalid page number.", 400));
    }

    if (isNaN(limit) || limit < 1) {
        return next(new CustomError("Invalid limit value.", 400));
    }

    const skip = (page - 1) * limit;

    const [doctorsList, totalDoctors] = await Promise.all([
        doctorSchema
            .find({ is_active: isActive })
            .skip(skip)
            .limit(limit),
        doctorSchema.countDocuments()
    ]);

    return successRes(
        res,
        200,
        doctorsList.length > 0 ? true : false,
        "Doctors list fetched successfully.",
        {
            totalDoctors,
            page,
            limit,
            totalPages: Math.ceil(totalDoctors / limit),
            doctorsList
        }
    );
});

module.exports.getDoctorById = asyncErrorHandler(async (req, res, next) => {
    let { doctorId, isActive } = req.query;
    if (!doctorId) {
        return next(new CustomError("Doctor Id is required", 400));
    }
    let doctor = await doctorSchema.findOne({
        _id: doctorId,
        is_active: isActive
    });
    if (!doctor) {
        return next(new CustomError("Doctor Not Found", 404))
    }
    return successRes(res, 200, true, "Doctor's Profile", doctor)
})

module.exports.changeDoctorStatus = asyncErrorHandler(async (req, res, next) => {
    let { doctorId } = req.body;
    if (!doctorId) {
        return next(new CustomError("Doctor Id is required", 400));
    }

    let findDoctor = await doctorSchema.findById(doctorId);
    if (!findDoctor) {
        return next(new CustomError("Doctor Not Found", 404))
    }

    findDoctor.is_active = !findDoctor.is_active;

    await findDoctor.save();
    return successRes(res, 200, true, "Status Updated Successfully")
})

module.exports.searchDoctor = asyncErrorHandler(async (req, res, next) => {
  let { query } = req.query;

  if (!query || query.trim() === "") {
    return next(new CustomError("Search query is required", 400));
  }

  query = query.trim();

  const doctors = await doctorSchema.find({
    $or: [
      { first_name: { $regex: query, $options: "i" } },
      { last_name: { $regex: query, $options: "i" } },
      { specialties: { $regex: query, $options: "i" } },
      { clinic_name: { $regex: query, $options: "i" } },
    ],
  });

  return successRes(
    res,
    200,
    doctors.length > 0,
    "Doctors fetched successfully",
    doctors
  );
});
