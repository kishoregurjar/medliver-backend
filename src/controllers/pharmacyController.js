const Admin = require('../modals/admin.Schema');
const Pharmacy = require('../modals/pharmacy.model');
const bcrypt = require('bcryptjs');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const CustomError = require('../utils/customError');
const { successRes } = require('../services/response');


module.exports.createPharmacy = asyncErrorHandler(async (req, res, next) => {
    const {
      name,
      email,
      password,
      role,
      ownerName,
      pharmacyName,
      phone,
      address,
      documents,
    } = req.body;
  
    if (!role || role !== 'pharmacy') {
      return next(new CustomError('Role must be pharmacy', 400));
    }
  
    if (!email || !password || !name || !ownerName || !pharmacyName || !phone) {
      return next(new CustomError('All required fields must be provided', 400));
    }
  
    const [existingPharmacy, existingAdmin] = await Promise.all([
      Pharmacy.findOne({ $or: [{ email }, { phone }] }),
      Admin.findOne({ email }),
    ]);
  
    if (existingPharmacy || existingAdmin) {
      return next(new CustomError('Email or phone already exists', 400));
    }
  
    const hashedPassword = await bcrypt.hash(password, 12);
  
    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      role,
      avatar: null,
      isActive: true,
    });
  
    await newAdmin.save();
  
    const newPharmacy = new Pharmacy({
      name: pharmacyName,
      ownerName,
      email,
      phone,
      password: hashedPassword,
      address,
      documents,
      status: 'active',
      adminId: newAdmin._id,
    });
  
    await newPharmacy.save();
  
    newAdmin.pharmacyId = newPharmacy._id;
    await newAdmin.save();
  
    const sanitizedAdmin = newAdmin.toObject();
    delete sanitizedAdmin.password;
  
    const pharmacyData = newPharmacy.toObject();
  
    return successRes(res, 201, true, 'Admin and Pharmacy created successfully.', {
      admin: sanitizedAdmin,
      pharmacy: pharmacyData,
    });
  });
  
module.exports.getPharmacyById = asyncErrorHandler(async (req, res, next) => {
    const { pharmacyId } = req.query;
    if(!pharmacyId)
    {
        return next(new CustomError('please provide pharmacyID', 404));
    }
  
    const pharmacy = await Pharmacy.findById(pharmacyId).populate('adminId');
  
    if (!pharmacy) {
      return next(new CustomError('Pharmacy not found', 404));
    }
  
    const pharmacyData = pharmacy.toObject();
  
    if (pharmacyData.adminId && pharmacyData.adminId.password) {
      delete pharmacyData.adminId.password; 
    }
  
    return successRes(res, 200, true, 'Pharmacy fetched successfully.', {
      pharmacy: pharmacyData,
    });
  });


//   module.exports.getMyPharmacy = asyncErrorHandler(async (req, res, next) => {
//     const admin = req.user;
  
//     if (!admin || !admin.pharmacyId) {
//       return next(new CustomError('Pharmacy not associated with admin', 404));
//     }
  
//     const pharmacy = await Pharmacy.findById(admin.pharmacyId);
  
//     if (!pharmacy) {
//       return next(new CustomError('Pharmacy not found', 404));
//     }
  
//     return successRes(res, 200, true, 'Pharmacy fetched successfully', pharmacy);
//   });

// module.exports.getMyPharmacy = asyncErrorHandler(async (req, res, next) => {
//     const admin = req.user; // assuming middleware sets req.user after JWT verification
  
//     if (!admin || !admin.pharmacyId) {
//       return next(new CustomError('Pharmacy not associated with admin', 404));
//     }
  
//     const pharmacy = await Pharmacy.findById(admin.pharmacyId);
  
//     if (!pharmacy) {
//       return next(new CustomError('Pharmacy not found', 404));
//     }
  
//     return successRes(res, 200, true, 'Pharmacy fetched successfully', {
//       pharmacy,
//     });
//   });

module.exports.deletePharmacy = asyncErrorHandler(async (req, res, next) => {
    const { pharmacyId } = req.query;
  
    const pharmacy = await Pharmacy.findById(pharmacyId);
  
    if (!pharmacy) {
      return next(new CustomError('Pharmacy not found', 404));
    }
  
    await Admin.findByIdAndDelete(pharmacy.adminId);

    await Pharmacy.findByIdAndDelete(pharmacyId);
  
    return successRes(res, 200, true, 'Pharmacy and associated admin deleted successfully.');
  });

  module.exports.updatePharmacy = asyncErrorHandler(async (req, res, next) => {
    const { pharmacyId, name, ownerName, phone, address, documents, status } = req.body;
  
    if (!pharmacyId) {
      return next(new CustomError("Pharmacy Id is required", 400));
    }
  
    const updateFields = {};
    if (name) updateFields.name = name;
    if (ownerName) updateFields.ownerName = ownerName;
    if (phone) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (documents) updateFields.documents = documents;
    if (status) updateFields.status = status;
  
    if (Object.keys(updateFields).length === 0) {
      return next(new CustomError("No fields provided for update", 400));
    }
  
    const updatedPharmacy = await Pharmacy.findByIdAndUpdate(
      pharmacyId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
  
    return successRes(res, 200, true, "Pharmacy updated successfully", updatedPharmacy);
  });


  module.exports.getAllPharmacy=asyncErrorHandler(async (req,res,next)=>{

    let {page,limit} = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page-1)*limit;

    const [totalPharmacy,allPharmacy]=await Promise.all([
        Pharmacy.countDocuments(),
        Pharmacy.find().populate("adminId").sort({createdAt:-1 }).skip(skip).limit(limit)
    ])

    if(allPharmacy.length === 0){
        return successRes(res,200,false,"No Pharmacy Found", []);
    }

    return successRes(res, 200, true, "pharmacy fetched successfully", {
        pharmacy: allPharmacy,
        currentPage: page,
        totalPages: Math.ceil(totalPharmacy / limit),
        totalPharmacy
    })
  })

  module.exports.searchPharmacy = asyncErrorHandler(async (req, res, next) => {
    let { page, limit, value } = req.query;
  
    if (!value) {
      return next(new CustomError("Search value is required", 400));
    }
  
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
  
    const regex = new RegExp(value, 'i'); // case-insensitive search
    const searchQuery = {
      $or: [
        { email: regex },
        { name: regex },
        { ownerName: regex }
      ]
    };
  
    const [totalPharmacy, allPharmacy] = await Promise.all([
      Pharmacy.countDocuments(searchQuery),
      Pharmacy.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);
  
    if (allPharmacy.length === 0) {
      return successRes(res, 200, false, "No Pharmacy Found", []);
    }
  
    return successRes(res, 200, true, "Pharmacy fetched successfully", {
      pharmacies: allPharmacy,
      currentPage: page,
      totalPages: Math.ceil(totalPharmacy / limit),
      totalPharmacy
    });
  });
    
// get pharmacy details by id
//delete pharmacy by id pharmacyId
//update-pharmacy-detils  



