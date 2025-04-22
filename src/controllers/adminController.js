const adminSchema = require('../modals/admin.Schema');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const CustomError = require('../utils/customError');
const { successRes } = require('../services/response');
const asyncErrorHandler = require('../utils/asyncErrorHandler');
// const { assignJwt } = require('../utils/jwtToken');
const { assignJwt } = require("../utils/jsonWebToken");
const { forgetPasswordMail } = require('../services/sendMail');
const { JsonWebTokenError } = require('jsonwebtoken');
const DeliveryPartner = require('../modals/delivery.model')
const Customer = require('../modals/customer.model');
require('dotenv').config();


module.exports.login = asyncErrorHandler(async (req, res, next) => {
    let { email, password } = req.body;

    if (!email || !password) {
        return next(new CustomError("Email and password are required", 400));
    }

    const findAdmin = await adminSchema.findOne({ email });

    if (!findAdmin) {
        return next(new CustomError("Invalid Email or Password", 404));
    }

    if (!findAdmin.password) {
        return next(new CustomError("Password not found for this account", 404));
    }

    let isMatch;
    console.log("findAdmin.password", findAdmin.password);
    try {
        isMatch = await bcrypt.compare(password, findAdmin.password); // Hash comparison
    } catch (error) {
        return next(new CustomError("Error comparing password", 500));
    }

    if (!isMatch) {
        return next(new CustomError("Invalid Email or Password", 404));
    }

    if (findAdmin.accountStatus === "blocked") {
        return next(new CustomError("Account is not active, Contact Administration", 400));
    }


    const payload = {
        _id: findAdmin._id,
        email: findAdmin.email,
        role: findAdmin.role,
        permissions: findAdmin.permissions,
    };


    const token = assignJwt(payload);


    const sanitizedAdmin = findAdmin.toObject();
    delete sanitizedAdmin.password;

    return successRes(res, 200, true, sanitizedAdmin.role === "superadmin" ? "Super Admin logged in successfully" : `${sanitizedAdmin.role} logged in successfully`, {
        ...sanitizedAdmin,
        token,
    });
});



module.exports.getAdminDetails = asyncErrorHandler(async (req, res, next) => {
    const admin = req.admin._id;
    console.log("admin", admin);
    const findAdmin = await adminSchema.findById(admin).select("-password -__v -createdAt -updatedAt");
    if (!findAdmin) {
        return next(new CustomError("Admin not found", 404));
    }

    const sanitizedAdmin = findAdmin.toObject();
    delete sanitizedAdmin.password;
    return successRes(res, 200, true, "Details fetched successfully", sanitizedAdmin);
})



module.exports.forgetPassword = asyncErrorHandler(async (req, res, next) => {
    const { email } = req.body;
    const findAdmin = await adminSchema.findOne({ email });
    if (!findAdmin) {
        return next(new CustomError("Admin not found", 404));
    }
    console.log("findAdmin", findAdmin);
    const payload = {
        _id: findAdmin._id,
        email: findAdmin.email,
        role: findAdmin.role
    };

    const token = assignJwt(payload);

    const resetPasswordLink = `${process.env.FORGET_PASSWORD_LINK}/${token}`;

    const sendMail = forgetPasswordMail(
        email,
        findAdmin.name,
        resetPasswordLink
    );

    return successRes(res, 200, true, "Password reset link sent successfully", token);
})


module.exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    try {
        const { resetLink, password } = req.body;

        let decoded;
        try {
            decoded = jsonwebtoken.verify(resetLink, process.env.SECRET_KEY);
            console.log(decoded, "decoded token");
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return next(
                    new CustomError("Reset link expired, please request a new one", 401)
                );
            }
            return next(new CustomError("Invalid token", 400));
        }

        const adminId = decoded._id;
        const findAdmin = await adminSchema.findById(adminId);
        if (!findAdmin) {
            return next(new CustomError("Admin not found", 404));
        }


        if (!password) {
            return next(new CustomError("Please provide a new password", 400));
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        findAdmin.password = hashedPassword;
        await findAdmin.save();

        return successRes(res, 200, true, "Password reset successfully");
    } catch (error) {
        return next(error);
    }
})


module.exports.changedPassword = asyncErrorHandler(async (req, res, next) => {
    const { password } = req.body;
    const adminId = req.admin._id;
    const findAdmin = await adminSchema.findById(adminId);
    if (!findAdmin) {
        return next(new CustomError("Admin not found", 404));
    }

    if (!password) {
        return next(new CustomError("Please provide a new password", 400));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    findAdmin.password = hashedPassword;
    await findAdmin.save();
    return successRes(res, 200, true, "Password changed successfully");
});



module.exports.updateAdminProfile = asyncErrorHandler(async (req, res, next) => {
    const adminId = req.admin._id;
    const findAdmin = await adminSchema.findById(adminId);
    if (!findAdmin) {
        return next(new CustomError("Admin not found", 404));
    }
    const updateAdmin = await adminSchema.findByIdAndUpdate(adminId, req.body, {
        new: true,
        runValidators: true,
    });
    return successRes(res, 200, true, "Admin updated successfully", updateAdmin);

});

/** ----------Delivery Partner ---------------- */

module.exports.approveDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const { partnerId } = req.body;
    const adminId = req.admin._id;
    if (!partnerId) {
        return next(new CustomError("Partner ID is required", 400));
    }

    const findAdmin = await adminSchema.findById(adminId);
    if (!findAdmin) {
        return next(new CustomError("Admin not found", 404));
    }

    const findPartner = await DeliveryPartner.findById(partnerId);
    if (!findPartner) {
        return next(new CustomError("Delivery Partner not found", 404));
    }

    if (!findPartner.isVerified) {
        return next(new CustomError("Partner's email is not verified", 400));
    }

    if (findPartner.isApproved) {
        return next(new CustomError("Partner is already approved", 400));
    }

    findPartner.isApproved = true;
    await findPartner.save();

    return successRes(res, 200, true, "Delivery Partner approved successfully.");
});


//by id
module.exports.getDeliveryPartnerById = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPartnerId } = req.query;

   if(!deliveryPartnerId) {
      return next(new CustomError("Delivery Partner Id is required", 400));
    }
    const partner = await DeliveryPartner.findById(deliveryPartnerId).select("-password -otp");
  
    if (!partner) {
      return next(new CustomError("Delivery Partner not found", 404));
    }
  
    return successRes(res, 200, true, "Delivery Partner fetched successfully", partner);
  });

  //get all
  module.exports.getAllDeliveryPartners = asyncErrorHandler(async (req, res, next) => {
    let { page, limit } = req.query;
    // const admin = req.admin;

    // if (!admin || admin.role !== "superadmin") {
    //     return next(new CustomError("Access denied: Only superadmin can perform this action", 403));
    //   }

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
  
    const [total, partners] = await Promise.all([
      DeliveryPartner.countDocuments(),
      DeliveryPartner.find().select("-password -otp").sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    if(partners.length === 0){
        return successRes(res,200,false,"No Delivery Partners Found", []);
    }

    return successRes(res, 200, true, "Delivery Partners fetched successfully", {
      partners,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  });

//delete

  module.exports.deleteDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPartnerId } = req.query;
      const admin = req.admin;

    if (!admin || admin.role !== "superadmin") {
        return next(new CustomError("Access denied: Only superadmin can perform this action", 403));
      }

    if (!deliveryPartnerId) {
        return next(new CustomError("Delivery Partner Id is required", 400));
      }
  
    const deleted = await DeliveryPartner.findByIdAndDelete(deliveryPartnerId);
  
    if (!deleted) {
      return next(new CustomError("Delivery Partner not found", 404));
    }
  
    return successRes(res, 200, true, "Delivery Partner deleted successfully", deleted);
  });
  
  //update 

module.exports.updateDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
  const { deliveryPartnerId } = req.body;

  if (!deliveryPartnerId) {
    return next(new CustomError("Delivery Partner ID is required", 400));
  }

  const {
    fullname,
    phone,
    email,
    profilePhoto,
    documents,
    emergencyContacts,
  } = req.body;

  const updateFields = {};

  if (fullname) updateFields.fullname = fullname;
  if (phone) updateFields.phone = phone;
  if (email) updateFields.email = email.toLowerCase();
  if (profilePhoto) updateFields.profilePhoto = profilePhoto;

  // Optional documents
  if (documents) {
    updateFields.documents = {};
    if (documents.aadharNumber) updateFields.documents.aadharNumber = documents.aadharNumber;
    if (documents.licenseNumber) updateFields.documents.licenseNumber = documents.licenseNumber;
    if (documents.idProof) updateFields.documents.idProof = documents.idProof;
  }

  if (emergencyContacts && Array.isArray(emergencyContacts)) {
    updateFields.emergencyContacts = emergencyContacts;
  }

  if (Object.keys(updateFields).length === 0) {
    return next(new CustomError("No fields provided for update", 400));
  }

  const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
    deliveryPartnerId,
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!updatedPartner) {
    return next(new CustomError("Delivery Partner not found", 404));
  }

  return successRes(res, 200, true, "Delivery Partner updated successfully", updatedPartner);
});

//update status
module.exports.updateAvailabilityStatus = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPartnerId, availabilityStatus } = req.body;
  
    if (!deliveryPartnerId) {
      return next(new CustomError("Delivery Partner ID is required", 400));
    }
  
    const validStatuses = ["available", "on-delivery", "offline"];

    if (!availabilityStatus || !validStatuses.includes(availabilityStatus)) {
      return next(new CustomError("Invalid or missing availability status", 400));
    }
  
    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
      deliveryPartnerId,
      { $set: { availabilityStatus } },
      { new: true, runValidators: true }
    );
  
    if (!updatedPartner) {
      return next(new CustomError("Delivery Partner not found", 404));
    }
  
    return successRes(res, 200, true, "Availability status updated successfully", updatedPartner);
  });

  //block

  module.exports.blockDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPartnerId } = req.body;
    const admin = req.admin;

    if (!admin || admin.role !== "superadmin") {
        return next(new CustomError("Only superadmin can blocked delivery partners", 403));
      }
  
    if (!deliveryPartnerId) {
      return next(new CustomError("Delivery Partner ID is required", 400));
    }

    const isBlocked = await DeliveryPartner.findById(deliveryPartnerId);
    if (isBlocked.isBlocked) {
        return next(new CustomError("Delivery Partner is already blocked", 400));
      }
  
    const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
      deliveryPartnerId,
      { $set: { isBlocked: true } },
      { new: true, runValidators: true }
    );

    if (!updatedPartner) {
      return next(new CustomError("Delivery Partner not found", 404));
    }
  
    return successRes(res, 200, true, "Delivery Partner blocked successfully", updatedPartner);
  });
  
  //unblock
  
  module.exports.unblockDeliveryPartner = asyncErrorHandler(async (req, res, next) => {
    const { deliveryPartnerId } = req.body;
    const admin = req.admin;
  
    if (!admin || admin.role !== "superadmin") {
      return next(new CustomError("Only superadmin can unblock delivery partners", 403));
    }

    if (!deliveryPartnerId) {
      return next(new CustomError("Delivery Partner ID is required", 400));
    }
  
    const partner = await DeliveryPartner.findById(deliveryPartnerId);
  
    if (!partner) {
      return next(new CustomError("Delivery Partner not found", 404));
    }
  
    if (!partner.isBlocked) {
      return next(new CustomError("Delivery Partner is already unblocked", 400));
    }
  

    partner.isBlocked = false;
    await partner.save();
  
    return successRes(res, 200, true, "Delivery Partner unblocked successfully", partner);
  });

  module.exports.getAllCustomers = asyncErrorHandler(async (req, res, next) => {
    let { page, limit, sortOrder } = req.query;
  
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
  
    const sortDir = sortOrder?.toLowerCase() === 'asc' ? 1 : -1; //default desc
  
    const [total, customers] = await Promise.all([
      Customer.countDocuments(),
      Customer.find()
        .select("-password -otp")
        .sort({ createdAt: sortDir })
        .skip(skip)
        .limit(limit)
    ]);
  
    if (customers.length === 0) {
      return successRes(res, 200, false, "No Customers Found", []);
    }
  
    return successRes(res, 200, true, "Customers fetched successfully", {
      customers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total
    });
  });
  
  
  module.exports.getCustomerById = asyncErrorHandler(async (req, res, next) => {
    const { customerId } = req.query;
  
    if (!customerId) {
      return next(new CustomError("Customer ID is required", 400));
    }
  
    const customer = await Customer.findById(customerId).select("-password -otp");
  
    if (!customer) {
      return next(new CustomError("Customer not found", 404));
    }
  
    return successRes(res, 200, true, "Customer fetched successfully", customer);
  });
  
  module.exports.BlockUnblockCustomer = asyncErrorHandler(async (req, res, next) => {
    const { customerId } = req.body;
    
    if (!customerId) {
      return next(new CustomError("Customer ID is required", 400));
    }
  
    
   const customer = await Customer.findById(customerId);
  
  
    if (!customer) {
      return next(new CustomError("Customer not found", 404));
    }


    if (customer.isBlocked === true) {
      customer.isBlocked = false; 
      await customer.save();
      return successRes(
        res,
        200,
        true,
        "Customer unblocked successfully",
        customer
      );
    }
  
    if (customer.isBlocked === false) {
      customer.isBlocked = true;
      await customer.save();
      return successRes(
        res,
        200,
        true,
        "Customer blocked successfully",
        customer
      );
    }
  });
  
  
  
  
  module.exports.uploadAdminAvatar = asyncErrorHandler(async (req, res, next) => {
    if (!req.file) {
      return next(new CustomError("No file uploaded.", 400));
    }

    const imageUrl = `${process.env.UPLOAD_ADMIN}${req.file.filename}`;
    return successRes(res, 200, true, "File Uploaded Successfully", { imageUrl });

  });

  
module.exports.uploadPharmacyDocument = asyncErrorHandler(async (req,res,next)=>{
  if (!req.file) {
          return next(new CustomError("No File Uploaded", 400))
      }
  
      const imagePath = `${process.env.PHARMACY_LICENCE}${req.file.filename}`;
  
      return successRes(res, 200, true, "Licence Uploaded Successfully", imagePath);
});