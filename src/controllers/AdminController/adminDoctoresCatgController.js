const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/customError")
const doctoreCatgModel = require("../../modals/doctorCategory.model")
const { successRes } = require("../../services/response")

module.exports.createDoctoreCatgegory = asyncErrorHandler(async(req,res,next)=>{
    const {name,description,image_url}=req.body;
    if(!name||!description){
        return next(new CustomError("Name is Required"),400);
    }
    const existing = await doctoreCatgModel.findOne({name:name.trim()});
    if(existing){
        return next(new CustomError("Category with this same name is already exist"));
    }
    const newCategory = await doctoreCatgModel.create({
        name:name.trim(),
        image_url,
        description
    })
    return successRes(res,201,true,"Doctore Category Created Successfully",newCategory)
})

module.exports.getDoctoresCategoryById= asyncErrorHandler(async (req, res, next) => {
  const { doctoreCatgId } = req.query;

  if (!doctoreCatgId) {
    return next(new CustomError("Doctores Category ID is required", 400));
  }

  const doctoreCatg = await doctoreCatgModel.findById(doctoreCatgId);

  if (!doctoreCatg) {
    return next(new CustomError("Doctores Category not found", 404));
  }

  return successRes(res, 200, true, "Doctores Category fetched successfully", doctoreCatg);
});

module.exports.deleteDoctoresCategoryById= asyncErrorHandler(async (req, res, next) => {
    const { doctoreCatgId } = req.query;
  
    if (!doctoreCatgId) {
      return next(new CustomError("Doctores Category ID is required", 400));
    }
  
    const doctoreCatg = await doctoreCatgModel.findByIdAndDelete(doctoreCatgId);
  
    if (!doctoreCatg) {
      return next(new CustomError("Doctores Category not found", 404));
    }
  
    return successRes(res, 200, true, "Doctores Category deleted successfully", doctoreCatg);
  });

   module.exports.updateDoctoresCatg = asyncErrorHandler(async (req, res, next) => {
      const { doctoreCatgId,name, image_url,description } = req.body;
    
      if (!doctoreCatgId) {
        return next(new CustomError("Doctore category ID is required", 400));
      }
    
      const updateFields = {};
      if (name) updateFields.name = name;
      if (image_url) updateFields.image_url = image_url;
      if (description) updateFields.description = description;
    
      if (Object.keys(updateFields).length === 0) {
        return next(new CustomError("No fields provided for update", 400));
      }
    
      const updatedRequest = await doctoreCatgModel.findByIdAndUpdate(
        doctoreCatgId,
        { $set: updateFields },
        { new: true, runValidators: true }
      );
    
      if (!updatedRequest) {
        return next(new CustomError("Doctore Category not found", 404));
      }
    
      return successRes(res, 200, true, "Doctore Category updated successfully", updatedRequest);
    });
  
module.exports.getAllDoctoreCategory = asyncErrorHandler(async (req, res, next) => {
    let { page, limit, sortOrder } = req.query;
  
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
  
    const sortDir = sortOrder?.toLowerCase() === "asc" ? 1 : -1; // default is descending
  
    const [total, doctoreCatg] = await Promise.all([
        doctoreCatgModel.countDocuments(),
        doctoreCatgModel.find().sort({ createdAt: sortDir }).skip(skip).limit(limit),
    ]);
  
    if (doctoreCatg.length === 0) {
      return successRes(res, 200, false, "No Doctore Category  Found", []);
    }
  
    return successRes(res, 200, true, "Doctores Category Requests fetched successfully", {
        doctoreCatg,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  });
  

  module.exports.uploadDoctoresCatgImage = asyncErrorHandler(async (req, res, next) => {
    if (!req.file) {
      return next(new CustomError("No file uploaded.", 400));
    }
    const imageUrl = `${process.env.UPLOAD_DOCTORE_CATG_IMG}${req.file.filename}`;

    return successRes(res, 200, true, "File Uploaded Successfully", { imageUrl });
  
  });

  module.exports.searchDoctoreCatg = asyncErrorHandler(async (req, res, next) => {
  let { query } = req.query;

  if (!query || query.trim() === "") {
    return next(new CustomError("Search query is required", 400));
  }

  query = query.trim();

  const matchedCategories = await doctoreCatgModel.find({
    name: { $regex: query, $options: "i" },
  });

  return successRes(
    res,
    200,
    matchedCategories.length > 0,
    "Doctor Categories fetched successfully",
    matchedCategories
  );
});
