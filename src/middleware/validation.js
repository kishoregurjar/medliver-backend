const Joi = require("joi");


const createPharmacy = Joi.object({
  ownerName: Joi.string().required().messages({
    "string.empty": "Owner name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid format",
  }),
  phone: Joi.string().required().messages({
    "string.empty": "Phone number is required",
  }),
  password: Joi.string()
  .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{6,20}$"))
  .required()
  .messages({
    "string.empty": "Password is required",
    "string.pattern.base": "Password must be 6-20 characters, include at least 1 uppercase letter, 1 lowercase letter, and 1 number",
  }),

  pharmacyName: Joi.string().required().messages({
    "string.empty": "Pharmacy name is required",
  }),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().required(),
  }).required(),
  documents: Joi.object({
    licenseNumber: Joi.string().required(),
    gstNumber: Joi.string().required(),
    licenseDocument: Joi.string().required(),
    verificationStatus: Joi.string().valid("pending", "approved", "rejected").required().optional()
  }).required()
});


  const getAndDeletePharmacyById = Joi.object({
    pharmacyId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Pharmacy ID is required",
        "string.pattern.base": "Invalid Pharmacy ID format",
      }),
  });

  const getAllPharmacy = Joi.object({
    page: Joi.number().integer().optional().messages({
      "number.base": "Page must be a number",
      "number.min": "Page number must be greater than 0",
    }),
    limit: Joi.number().integer().min(1).optional().messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be greater than 0",
    })
  });

  const updatePharmacy = Joi.object({
    pharmacyId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Pharmacy ID is required",
        "string.pattern.base": "Invalid Pharmacy ID format",
      }),
  
    pharmacyName: Joi.string().optional().messages({
      "string.empty": "Pharmacy name cannot be empty",
    }),
  
    ownerName: Joi.string().optional().messages({
      "string.empty": "Owner name cannot be empty",
    }),
  
    phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.empty": "Phone number cannot be empty",
      "string.pattern.base": "Phone number must be exactly 10 digits",
    }),
    email: Joi.string().email().optional().messages({
      "string.email": "Invalid email format",
    }),
  
    location: Joi.object({
      lat: Joi.number().optional().messages({
        "number.base": "Latitude must be a number",
      }),
      long: Joi.number().optional().messages({
        "number.base": "Longitude must be a number",
      }),
    }).optional(),
    verificationStatus: Joi.string()
      .valid("pending", "approved", "rejected")
      .optional()
      .messages({
        "any.only": "Verification status must be 'pending', 'approved', or 'rejected'",
      }),
  });

  //pathology validation
  const createPathologyCenter = Joi.object({
    adminId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required().optional()
      .messages({
        "string.empty": "Admin ID is required",
        "string.pattern.base": "Invalid Admin ID format",
      }),
  
    centerName: Joi.string().required().messages({
      "string.empty": "Center name is required",
    }),
  
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Email must be a valid format",
    }),
  
    phoneNumber: Joi.string()
  .pattern(/^[0-9]{10}$/)
  .optional()
  .messages({
    "string.empty": "Phone number cannot be empty",
    "string.pattern.base": "Phone number must be exactly 10 digits",
  }),
    password: Joi.string()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{6,20}$"))
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base": "Password must be 6-20 characters, include at least 1 uppercase letter, 1 lowercase letter, and 1 number",
    }),
    address: Joi.string().required().messages({
      "string.empty": "Address is required",
    })

  }).optional()

  const getAndDeletePathologyCenterById = Joi.object({
    pathologyCenterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Pathology Center ID is required",
        "string.pattern.base": "Invalid Pathology Center ID format",
      }),
  });

  const updatePathologyCenter = Joi.object({
    pathologyCenterId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Pathology Center ID is required",
        "string.pattern.base": "Invalid Pathology Center ID format",
      }),
  
    centerName: Joi.string().optional().messages({
      "string.empty": "Center name cannot be empty",
    }),
  
    email: Joi.string().email().optional().messages({
      "string.email": "Email must be a valid format",
    }),
  
    phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional()
      .messages({
        "string.empty": "Phone number cannot be empty",
        "string.pattern.base": "Phone number must be exactly 10 digits",
      }),
  
    password: Joi.string()
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{6,20}$"))
      .optional()
      .messages({
        "string.pattern.base":
          "Password must be 6-20 characters, include at least 1 uppercase letter, 1 lowercase letter, and 1 number",
      }),
  
    address: Joi.string().optional().messages({
      "string.empty": "Address cannot be empty",
    }),
  });
  
  const searchPathologyCenter = Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
      "number.base": "Page must be a number",
      "number.min": "Page must be at least 1",
    }),
    limit: Joi.number().integer().min(1).optional().messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be greater than 0",
    }),
    value: Joi.string().optional().messages({
      "string.base": "Search must be a text string",
    }),
  });
  //feature validation
  const createFeature = Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Product ID is required",
        "string.pattern.base": "Invalid Product ID format",
      }),
  
    featuredAt: Joi.date().optional().messages({
      "date.base": "Featured date must be a valid date",
    }),
  
    isActive: Joi.boolean().optional().messages({
      "boolean.base": "isActive must be a boolean value",
    }),
  });

  const getOrDeleteFeatureById = Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Feature ID is required",
        "string.pattern.base": "Invalid Feature ID format",
      }),
  });

  const updateFeatureStatus = Joi.object({
    productId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Feature ID is required",
        "string.pattern.base": "Invalid Feature ID format",
      }),

  });

  const getAllFeatures = Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be an integer",
      "number.min": "Page number must be at least 1",
    }),
  
    limit: Joi.number().integer().min(1).optional().messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
    }),
  });
  
  //deliveryPartner
  const registerDeliveryPartner = Joi.object({
    fullName: Joi.string().required().messages({
      "string.empty": "Full name is required",
    }),
  
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Email must be a valid format",
    }),
  
    phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "string.empty": "Phone number is required",
        "string.pattern.base": "Phone number must be exactly 10 digits",
      }),
  
    password: Joi.string()
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{6,20}$"))
      .required()
      .messages({
        "string.empty": "Password is required",
        "string.pattern.base":
          "Password must be 6-20 characters, include at least 1 uppercase letter, 1 lowercase letter, and 1 number",
      }),
  
    profilePhoto: Joi.string().uri().optional().messages({
      "string.uri": "Profile photo must be a valid URL",
    }),
  
    documents: Joi.object({
      aadharNumber: Joi.string().required().messages({
        "string.empty": "Aadhar number is required",
      }),
      licenseNumber: Joi.string().required().messages({
        "string.empty": "License number is required",
      }),
      idProof: Joi.string().required().messages({
        "string.empty": "ID proof is required",
      }),
    }).required().messages({
      "object.base": "Documents must be an object with aadharNumber, licenseNumber, and idProof",
    }),
  });
  const getOrDeleteDeliveryPartner = Joi.object({
    partnerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      "string.empty": "Delivery Partner ID is required",
      "string.pattern.base": "Invalid ID format",
    }),
  });

  const blockUnblockDeliveryPartner = Joi.object({
    partnerId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      "string.empty": "Delivery Partner ID is required",
      "string.pattern.base": "Invalid ID format",
    }),
  });
  const updateDeliveryPartner = Joi.object({
    partnerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Delivery Partner ID is required",
        "string.pattern.base": "Invalid Delivery Partner ID format",
      }),
  
    fullname: Joi.string().optional(),
  
    phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional()
      .messages({
        "string.pattern.base": "Phone number must be exactly 10 digits",
      }),
  
    email: Joi.string().email().optional().messages({
      "string.email": "Invalid email format",
    }),
  
    profilePhoto: Joi.string().optional(),
  
    documents: Joi.object({
      aadharUrls: Joi.object({
        front: Joi.string().optional(),
        back: Joi.string().optional(),
      }).optional(),
      licenseUrl: Joi.string().optional(),
      verificationStatus: Joi.string().valid("pending", "approved", "rejected").optional(),
    }).optional(),
  
    emergencyContacts: Joi.array().items(
      Joi.object({
        name: Joi.string().required().messages({
          "string.empty": "Emergency contact name is required",
        }),
        phone: Joi.string()
          .pattern(/^[0-9]{10}$/)
          .required()
          .messages({
            "string.empty": "Emergency contact phone is required",
            "string.pattern.base": "Phone number must be exactly 10 digits",
          }),
      })
    ).optional(),
  });

  const updateDeliveryPartnerStatus = Joi.object({
    partnerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Delivery Partner ID is required",
        "string.pattern.base": "Invalid Delivery Partner ID format",
      }),
  
    availabilityStatus: Joi.string()
      .valid("available", "on-delivery", "offline")
      .required()
      .messages({
        "string.empty": "Availability status is required",
        "any.only": "Availability status must be one of: available, on-delivery, or offline",
      }),
  });
  const getAllDeliveryPartners = Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
      "number.base": "Page must be a number",
      "number.min": "Page number must be at least 1",
    }),
    limit: Joi.number().integer().min(1).optional().messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be greater than 0",
    }),
  });
  //customerControllerAdmin
  const getAllCustomersValidation = Joi.object({
    page: Joi.number().min(1).optional().messages({
      "number.base": "Page must be a number",
      "number.min": "Page must be at least 1",
    }),
    limit: Joi.number().min(1).optional().messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
    }),
    sortOrder: Joi.string().valid("asc", "desc").optional().messages({
      "string.valid": "Sort order must be either 'asc' or 'desc'",
    }),
  });

  const getCustomerByIdValidation = Joi.object({
    customerId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        "string.empty": "Customer ID is required",
        "string.pattern.base": "Invalid Customer ID format",
      }),
  });
  
  

  const validate = (schema) => {
    return (req, res, next) => {
      const { error } = schema.validate(req.body);
      if (error) {
        const errorMessage = error.details
          .map((detail) => detail.message)
          .join(", ");
        return res.status(400).json({ success: false, message: errorMessage });
      }
      next();
    };
  };
const validateQuery = (schema) => {
    return (req, res, next) => {
      const { error } = schema.validate(req.query);
      if (error) {
        const errorMessage = error.details
          .map((detail) => detail.message)
          .join(", ");
        return res.status(400).json({ success: false, message: errorMessage });
      }
      next();
    };
  };




module.exports={
    validate,
    validateQuery,
    createPharmacy,
    getAndDeletePharmacyById,
    getAllPharmacy,
    updatePharmacy,
    createPathologyCenter,
    getAndDeletePathologyCenterById,
    updatePathologyCenter,
    searchPathologyCenter,
    createFeature,
    getOrDeleteFeatureById,
    updateFeatureStatus,
    getAllFeatures,
    registerDeliveryPartner,
    getOrDeleteDeliveryPartner,
    getAllDeliveryPartners,
    updateDeliveryPartner,
    updateDeliveryPartnerStatus,
    blockUnblockDeliveryPartner,
    getAllCustomersValidation,
    getCustomerByIdValidation
}