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
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{6,20}$")
    )
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 6-20 characters, include at least 1 uppercase letter, 1 lowercase letter, and 1 number",
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
    verificationStatus: Joi.string()
      .valid("pending", "approved", "rejected")
      .required()
      .optional(),
  }).required(),
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
  }),
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

  email: Joi.string().email().optional().messages({
    "string.email": "Invalid email format",
  }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone number must be exactly 10 digits",
    }),

  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional(),
  }).optional(),

  documents: Joi.object({
    licenseNumber: Joi.string().optional(),
    gstNumber: Joi.string().optional(),
    licenseDocument: Joi.string().optional(),
    verificationStatus: Joi.string()
      .valid("pending", "approved", "rejected")
      .optional()
      .messages({
        "any.only":
          "Verification status must be 'pending', 'approved', or 'rejected'",
      }),
  }).optional(),

  commissionRate: Joi.number().optional().messages({
    "number.base": "Commission rate must be a number",
  }),

  status: Joi.string()
    .valid("active", "inactive", "blocked")
    .optional()
    .messages({
      "any.only": "Status must be 'active', 'inactive', or 'blocked'",
    }),
});

const changeStatusPharmacyValidation = Joi.object({
  pharmacyId: Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .required()
  .messages({
    "string.empty": "Pharmacy ID is required",
    "string.pattern.base": "Invalid Pharmacy ID format",
  }),
});

//pathology validation
const createPathologyCenter = Joi.object({
  adminId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .optional()
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
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{6,20}$")
    )
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 6-20 characters, include at least 1 uppercase letter, 1 lowercase letter, and 1 number",
    }),
  address: Joi.string().required().messages({
    "string.empty": "Address is required",
  }),
}).optional();

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
  ownerName: Joi.string().optional().messages({
    "string.empty": "Owner namecannot be empty",
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
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{6,20}$")
    )
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

const approveRejectDeliveryPartnerValidation = Joi.object({
  partnerId: Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .required()
  .messages({
    "string.empty": "Partner ID is required",
    "string.pattern.base": "Invalid Partner ID format",
  }),
  status: Joi.string()
    .valid("approved", "rejected")
    .required()
    .messages({
      "any.only": "Status must be either 'approved' or 'rejected'",
      "string.empty": "Status is required",
      "any.required": "Status is required",
    }),
});

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
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{6,20}$")
    )
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
  })
    .required()
    .messages({
      "object.base":
        "Documents must be an object with aadharNumber, licenseNumber, and idProof",
    }),
});
const getOrDeleteDeliveryPartner = Joi.object({
  partnerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Delivery Partner ID is required",
      "string.pattern.base": "Invalid ID format",
    }),
});

const blockUnblockDeliveryPartner = Joi.object({
  partnerId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
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
    verificationStatus: Joi.string()
      .valid("pending", "approved", "rejected")
      .optional(),
  }).optional(),

  emergencyContacts: Joi.array()
    .items(
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
    )
    .optional(),
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
      "any.only":
        "Availability status must be one of: available, on-delivery, or offline",
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
const getAllFeatureProductValidation = Joi.object({
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

const getAllSellingProductValidation = Joi.object({
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

//common you can use for getAll api's
const getAllSpecialOfferValidation = Joi.object({
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

const getAllApiValidation = Joi.object({
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
//test validation

const createTestValidation = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
  }),
  description: Joi.string().allow(null, "").optional(),
  price: Joi.number().required().messages({
    "number.base": "Price must be a number",
    "any.required": "Price is required",
  }),
  sample_required: Joi.string().optional(),
  preparation: Joi.string().optional(),
  delivery_time: Joi.string().optional(),
  available_at_home:Joi.boolean().optional(),
  available:Joi.boolean().optional()
});

const getTestdeleteAndById = Joi.object({
  testId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Test ID is required",
      "string.pattern.base": "Invalid Test ID format",
    }),
});

const updateTestValidation = Joi.object({
  testId: Joi.string().required().messages({
    "any.required": "Test ID is required",
    "string.base": "Test ID must be a string"
  }),
  name: Joi.string().trim().optional(),
  price: Joi.number().optional().messages({
    "number.base": "Price must be a number"
  }),
  sample_required: Joi.boolean().optional(),
  preparation: Joi.string().allow('', null).optional(),
  delivery_time: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  available_at_home: Joi.boolean().optional(),
  available: Joi.boolean().optional()
});

const searchTestValidation = Joi.object({
  value: Joi.string().trim().required().messages({
    "any.required": "Search value is required",
    "string.base": "Search value must be a string"
  }),
  page: Joi.number().optional(),
  limit: Joi.number().optional()
});

//admin validation 
const loginValidation = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  }),
});

const forgetPasswordValidation = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
});

const resetPasswordValidation = Joi.object({
  resetLink: Joi.string().required().messages({
    'any.required': 'Reset link is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
});

const changePasswordValidation = Joi.object({
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
});

const updateAdminProfileValidation = Joi.object({
  name: Joi.string().optional(),
  phoneNumber: Joi.string().optional(),
  // email is explicitly disallowed
  email: Joi.any().forbidden().messages({
    'any.unknown': 'Email update is not allowed'
  }),
});

//admin best selling product validation
const createBestSelling = Joi.object({
  productId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Best Selling ID is required",
      "string.pattern.base": "Invalid Best Selling Product ID format",
    }),
});

const UpdateAndDeleteBestSelling = Joi.object({
  bestSellingProductId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Best Selling Product ID is required",
      "string.pattern.base": "Invalid Best Selling Product ID format",
    }),
});

// Doctore Profile validation
const createDoctorProfileValidation = Joi.object({
  first_name: Joi.string().trim().required().messages({
    'string.empty': 'First name is required',
    'any.required': 'First name is required'
  }),
  last_name: Joi.string().trim().required().messages({
    'string.empty': 'Last name is required',
    'any.required': 'Last name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
    'string.empty': 'Email is required'
  }),
  phone_number: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
    'string.empty': 'Phone number is required',
    'any.required': 'Phone number is required',
    'string.pattern.base': 'Phone number must be a valid 10-digit number starting with 6-9'
  }),
  category_id: Joi.array().items(Joi.string().trim().required()).min(1).required().messages({
    'array.min': 'At least one category is required',
    'any.required': 'Category is required'
  }),
  profile_image: Joi.string().trim().required().messages({
    'string.empty': 'Profile image is required',
    'any.required': 'Profile image is required'
  }),
  qualifications: Joi.string().trim().required().messages({
    'string.empty': 'Qualifications are required',
    'any.required': 'Qualifications are required'
  }),
  specialties: Joi.string().trim().required().messages({
    'string.empty': 'Specialties are required',
    'any.required': 'Specialties are required'
  }),
  clinic_name: Joi.string().trim().required().messages({
    'string.empty': 'Clinic name is required',
    'any.required': 'Clinic name is required'
  }),
  clinic_address: Joi.string().trim().required().messages({
    'string.empty': 'Clinic address is required',
    'any.required': 'Clinic address is required'
  }),
  available_at_home: Joi.boolean().optional(),
  consultation_fee: Joi.number().required().messages({
    'number.base': 'Consultation fee must be a number',
    'any.required': 'Consultation fee is required'
  }),
  availability: Joi.string().trim().optional(),
  experience: Joi.string().trim().required().messages({
    'string.empty': 'Experience is required',
    'any.required': 'Experience is required'
  }),
  description: Joi.string().trim().required().messages({
    'string.empty': 'Description is required',
    'any.required': 'Description is required'
  }),
});

const getDoctoreByIdAndChangeStatusValidation = Joi.object({
  doctorId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Doctore ID is required",
      "string.pattern.base": "Invalid Doctore ID format",
    }),
    isActive: Joi.boolean().optional()

});

const getAllDoctoreProfile = Joi.object({
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
  isActive: Joi.boolean().optional()

});

//medicine validation
const createMedicineValidation = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Medicine name is required',
    'any.required': 'Medicine name is required',
  }),
  price: Joi.number().positive().required().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be a positive number',
    'any.required': 'Price is required',
  }),
  manufacturer: Joi.string().trim().required().messages({
    'string.empty': 'Manufacturer is required',
    'any.required': 'Manufacturer is required',
  }),
  packSizeLabel: Joi.string().trim().required().messages({
    'string.empty': 'Pack size label is required',
    'any.required': 'Pack size label is required',
  }),
});

const updateMedicineValidation = Joi.object({
  medicineId: Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .required()
  .messages({
    "string.empty": "Medicine ID is required",
    "string.pattern.base": "Invalid Medicine ID format",
  }),
  name: Joi.string().trim().optional(),
  price: Joi.number().positive().optional().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be a positive number',
  }),
  manufacturer: Joi.string().trim().optional(),
  packSizeLabel: Joi.string().trim().optional(),
  description: Joi.string().trim().optional()
});


const getMedicineByIdValidation = Joi.object({
  medicineId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Medicine ID is required",
      "string.pattern.base": "Invalid Medicine ID format",
    }),
    isActive: Joi.boolean().optional()

});

const deleteMedicineValidation = getMedicineByIdValidation;

const searchMedicineValidation = Joi.object({
  query: Joi.string().trim().required().messages({
    'string.empty': 'Search query is required',
    'any.required': 'Search query is required',
  }),
  page: Joi.number().integer().min(1).optional(),
});

// doctore Lead Validation

const createDoctorLeadValidation = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.email": "Please provide a valid email address",
    "string.empty": "Email cannot be empty",
  }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .messages({
      "string.pattern.base": "Phone number must be a valid 10-digit Indian number",
    }),
  address: Joi.string().trim().messages({
    "string.empty": "Address cannot be empty",
  }),
  disease: Joi.string().trim().messages({
    "string.empty": "Disease cannot be empty",
  }),
});

const getAllDoctoreLeadValidation = Joi.object({
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
const getAnddeleteDoctoreLeadByIdValidation = Joi.object({
  DoctoreLeadId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "Doctore LeadId  is required",
      "string.pattern.base": "Invalid DoctoreLead ID format",
    }),
});

const updateDoctorLeadValidation = Joi.object({
  DoctoreLeadId: Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .required()
  .messages({
    "string.empty": "Doctore LeadId  is required",
    "string.pattern.base": "Invalid DoctoreLead ID format",
  }),
  name: Joi.string().trim().optional(),
  email: Joi.string().email().optional().messages({
    "string.email": "Please provide a valid email address",
  }),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional().messages({
    "string.pattern.base": "Phone number must be a valid 10-digit Indian number",
  }),
  address: Joi.string().trim().optional(),
  disease: Joi.string().trim().optional(),
  isArchived: Joi.boolean().optional(),
});

// doctore Category validation 

const createDoctorCategoryValidation = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
  }),
  description: Joi.string().trim().required().messages({
    "any.required": "Description is required",
    "string.empty": "Description cannot be empty",
  }),
  image_url: Joi.string().uri().optional().messages({
    "string.uri": "Image URL must be a valid URI",
  }),
});

const updateDoctorCategoryValidation = Joi.object({
  doctoreCatgId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid doctor category ID format",
    "string.empty": "Doctor category ID is required",
  }),
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().optional(),
  image_url: Joi.string().uri().optional().messages({
    "string.uri": "Image URL must be a valid URI",
  }),
});

const getAndDeleteDoctorCategoryByIdValidation = Joi.object({
  doctoreCatgId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid doctor category ID format",
    "string.empty": "Doctor category ID is required",
  }),
});

const getAllDoctorCategoryValidation = Joi.object({
  page: Joi.number().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().min(1).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
  }),
  sortOrder: Joi.string().valid("asc", "desc").optional().messages({
    "any.only": "Sort order must be either 'asc' or 'desc'",
  }),
});

// feature product validation

const createFeaturedProductValidation = Joi.object({
  productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "any.required": "Medicine ID is required",
    "string.empty": "Medicine ID cannot be empty",
    "string.pattern.base": "Invalid Medicine ID format",
  }),
});

// Validate get/delete/update by productId in query
const getAndDeleteFeatureProductIdValidation = Joi.object({
  productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "any.required": "Product ID is required",
    "string.empty": "Product ID cannot be empty",
    "string.pattern.base": "Invalid Product ID format",
  }),
});

// Validate pagination and sorting in getAllFeaturedProducts
const getAllFeaturedProductsValidation = Joi.object({
  page: Joi.number().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().min(1).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
  }),
  sortOrder: Joi.string().valid("asc", "desc").optional().messages({
    "any.only": "Sort order must be either 'asc' or 'desc'",
  }),
});

const updateFeaturedProductStatusValidation = Joi.object({
  productId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid product ID format",
      "any.required": "Featured product ID is required",
      "string.empty": "Featured product ID cannot be empty",
    }),
});

//insurance validation

const applyInsuranceSchema = Joi.object({
  full_name: Joi.string().required().messages({
    "any.required": "Full name is required"
  }),
  phone_number: Joi.string().length(10).pattern(/^\d+$/).required().messages({
    "any.required": "Phone number is required",
    "string.length": "Phone number must be exactly 10 digits",
    "string.pattern.base": "Phone number must contain only digits"
  }),
  email: Joi.string().email().allow(null, "").messages({
    "string.email": "Email must be a valid email address"
  }),
  lead_type: Joi.string().valid("health", "life").required().messages({
    "any.required": "Lead type is required",
    "any.only": "Lead type must be either 'health' or 'life'"
  }),
  age: Joi.number().required().messages({
    "any.required": "Age is required"
  }),
  gender: Joi.string().valid("male", "female", "other").required().messages({
    "any.required": "Gender is required",
    "any.only": "Gender must be 'male', 'female' or 'other'"
  }),
  coverage_for: Joi.string().valid("self", "family").required().messages({
    "any.required": "Coverage type is required",
    "any.only": "Coverage type must be either 'self' or 'family'"
  }),
  family_member_count: Joi.when("coverage_for", {
    is: "family",
    then: Joi.number().required().messages({
      "any.required": "Family member count is required for family coverage"
    }),
    otherwise: Joi.forbidden().messages({
      "any.unknown": "Family member count should not be provided for self coverage"
    })
  }),
  nominee_name: Joi.string().allow(null, ""),
  nominee_relation: Joi.string().allow(null, ""),
  income: Joi.when("lead_type", {
    is: "life",
    then: Joi.number().required().messages({
      "any.required": "Income is required for life insurance leads"
    }),
    otherwise: Joi.forbidden().messages({
      "any.unknown": "Income should not be provided for health insurance leads"
    })
  }),
  lead_source: Joi.string().allow(null, "")
});


const getAllInsuranceLeadsValidation = Joi.object({
  page: Joi.number().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().min(1).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
  }),
  is_archived: Joi.string().valid("true", "false").optional().messages({
    "any.only": "is_archived must be either 'true' or 'false'",
  }),
});

const getInsuranceByIdValidation = Joi.object({
  insuranceId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid insurance ID format",
      "any.required": "insurance ID is required",
      "string.empty": "insurance ID cannot be empty",
    }),
});

const archiveInsuranceByIdValidation = Joi.object({
  insuranceId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid insurance ID format",
      "any.required": "insurance ID is required",
      "string.empty": "insurance ID cannot be empty",
    }),
});

//** Special Offer Validation */

const createSpecialOfferValidation = Joi.object({
  product: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid product ID format",
    "any.required": "Product ID is required",
  }),
  offerPercentage: Joi.number().min(0).required().messages({
    "number.base": "Offer percentage must be a number",
    "number.min": "Offer percentage cannot be less than 0",
    "any.required": "Offer percentage is required",
  }),
  validTill: Joi.string()
  .pattern(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/)
  .required()
  .messages({
    'string.pattern.base': 'Valid till date must be in DD/MM/YYYY format',
    'any.required': 'Valid till date is required',
  }),
});

// Update Special Offer
const updateSpecialOfferValidation = Joi.object({
  specialOfferId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid special offer ID format",
    "any.required": "Special offer ID is required",
  }),
  offerPercentage: Joi.number().min(0).required().messages({
    "number.base": "Offer percentage must be a number",
    "number.min": "Offer percentage cannot be less than 0",
    "any.required": "Offer percentage is required",
  }),
});

// Get/Delete Special Offer by ID
const specialOfferIdQueryValidation = Joi.object({
  specialOfferId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid special offer ID format",
    "any.required": "Special offer ID is required",
  }),
});

// Activate/Deactivate Special Offer
const activeDeactiveSpecialOfferValidation = Joi.object({
  specialOfferId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid special offer ID format",
    "any.required": "Special offer ID is required",
  }),
  isActive: Joi.boolean().required().messages({
    "boolean.base": "isActive must be true or false",
    "any.required": "isActive status is required",
  }),
});

// Get All Special Offers
const getAllSpecialOffersValidation = Joi.object({
  page: Joi.number().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().min(1).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
  }),
});

//  CREATE Test Category validation
const createTestCategory = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": "Name must be a string",
    "any.required": "Category name is required",
  }),
  description: Joi.string().allow("").optional(),
  image_url: Joi.string().uri().allow("").optional(),
  tests: Joi.array().optional().messages({
    "array.base": "Tests should be an array of valid IDs",
  }),
});

const updateTestCategory = Joi.object({
  testCatgId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid Test category ID format",
    "any.required": "Test categoryID is required",
  }),
  name: Joi.string().trim().optional(),
  description: Joi.string().optional(),
  image_url: Joi.string().uri().optional(),
  tests: Joi.array().optional().messages({
    "array.base": "Tests should be an array of valid IDs",
  }),
});

const getOrDeleteTestCategory = Joi.object({
  testCatgId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid Test category ID format",
    "any.required": "Test categoryID is required",
  }),
});

// REMOVE Test from Category
const removeTestFromCategory = Joi.object({
  testCatgId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid Test category ID format",
    "any.required": "Test categoryID is required",
  }),
  testId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid test ID format",
    "any.required": "test Id is required",
  }),
});

const getAllTestCatgValidation = Joi.object({
  page: Joi.number().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().min(1).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
  }),
});

//vehicle validation
const getAllVehicleRequestsValidation = Joi.object({
  page: Joi.number().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().min(1).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
  }),
  sortOrder: Joi.string().valid("asc", "desc").optional().messages({
    "string.base": "Sort order must be a string",
    "any.only": "Sort order must be either 'asc' or 'desc'",
  }),
  is_archived: Joi.string().valid("true", "false").optional().messages({
    "any.only": "is_archived must be either 'true' or 'false'",
  }),
});

// GET vehicle request by ID
const getVehicleRequestByIdValidation = Joi.object({
  vehiclerequestId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid vehicle request ID format",
    "any.required": "Vehicle request ID is required",
  }),
});

// UPDATE vehicle request
const updateVehicleRequestValidation = Joi.object({
  vehiclerequestId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid vehicle request ID format",
    "any.required": "Vehicle request ID is required",
  }),
  patient_name: Joi.string().optional().messages({
    "string.base": "Patient name must be a string",
  }),
  patient_phone: Joi.string().optional().messages({
    "string.base": "Patient phone must be a string",
  }),
  emergency_type: Joi.string().optional().messages({
    "string.base": "Emergency type must be a string",
  }),
  location: Joi.string().optional().messages({
    "string.base": "Location must be a string",
  }),
  address: Joi.string().optional().messages({
    "string.base": "Address must be a string",
  }),
  destination_hospital: Joi.string().optional().messages({
    "string.base": "Destination hospital must be a string",
  }),
  vehicle_type: Joi.string().optional().messages({
    "string.base": "Vehicle type must be a string",
  }),
});

// ARCHIVE vehicle request
const archiveVehicleRequestValidation = Joi.object({
  vehiclerequestId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid vehicle request ID format",
    "any.required": "Vehicle request ID is required",
  }),
});

// delivery rate validation
const setDeliveryRateValidation = Joi.object({
  deliveryRate: Joi.number().positive().required().messages({
    "any.required": "Delivery Rate is required",
    "number.base": "Delivery Rate must be a number",
    "number.positive": "Delivery Rate must be a positive number",
  }),
});

const rateIdValidation = Joi.object({
  rateId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid rate ID format",
    "any.required": "rate Id is required",
  }),
});

const editRateValidation = Joi.object({
  rateId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid rate ID format",
    "any.required": "rate Id is required",
  }),
  deliveryRate: Joi.number().positive().required().messages({
    "any.required": "Delivery Rate is required",
    "number.base": "Delivery Rate must be a number",
    "number.positive": "Delivery Rate must be a positive number",
  }),
});

// payment validation
const initiateRefundValidation = Joi.object({
  payment_id: Joi.string().required().messages({
    "string.base": "Payment ID must be a string",
    "string.empty": "Payment ID is required",
  }),
  amount: Joi.number().positive().optional().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be a positive number"
  }),
  speed: Joi.string().valid("normal", "optimum").optional().messages({
    "any.only": "Speed must be either 'normal' or 'optimum'",
    "string.base": "Speed must be a string"
  })
});

// customer controller validation
const registerCustomerSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 3 characters",
  }),

  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Invalid email format",
  }),

  password: Joi.string()
  .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$"))
  .required()
  .messages({
    "string.empty": "Password is required",
    "string.pattern.base":
      "Password must be at least 6 characters and include uppercase, lowercase, number, and special character",
  }),

  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be 10 digits",
    }),
  userCoordinates: Joi.object({
    lat: Joi.number().required().optional(),
    long: Joi.number().required().optional(),
  }).optional() // optional based on your implementation
});

const CustomerverifyOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Invalid email format",
  }),
  otp: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .required()
    .messages({
      "string.empty": "OTP is required",
      "string.pattern.base": "OTP must be a 4-digit number",
    }),
});

const loginCustomerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Invalid email format",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
})

const forgetPasswordCustomerValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Invalid email format",
  }),
})

const resetPasswordCustomerValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,}$"
      )
    )
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be at least 6 characters and include uppercase, lowercase, number, and special character",
    }),
});
// const updateUserProfileValidation = Joi.object({
//   fullName: Joi.string().min(2).max(50).optional().messages({
//     "string.min": "Full name must be at least 2 characters",
//     "string.max": "Full name must not exceed 50 characters",
//   }),
//   email: Joi.string().email().optional().messages({
//     "string.email": "Please enter a valid email address",
//   }),
//   phoneNumber: Joi.string()
//     .pattern(/^[6-9]\d{9}$/)
//     .optional()
//     .messages({
//       "string.pattern.base": "Phone number must be a valid 10-digit Indian number",
//     }),
//   userCoordinates: Joi.object({
//     lat: Joi.number().required().optional().messages({
//       "number.base": "Latitude must be a number",
//       "any.required": "Latitude is required",
//     }),
//     long: Joi.number().required().optional().messages({
//       "number.base": "Longitude must be a number",
//       "any.required": "Longitude is required",
//     }),
//   }).optional(),
// }).optional();


const signUpSignInWithGoogleValidation = Joi.object({
  fullName: Joi.string().min(2).max(50).required().messages({
    "string.base": "Full name must be a string",
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 2 characters",
    "string.max": "Full name must not exceed 50 characters",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "string.empty": "Email is required",
  }),
  profilePicture: Joi.string().uri().required().optional().messages({
    "string.uri": "Profile picture must be a valid URL",
    "string.empty": "Profile picture is required",
  }),
});

// Customer address validation
const addAddressValidation = Joi.object({
  address_type: Joi.string().valid("home", "work", "other").optional().messages({
    "string.base": "Address type must be a string",
    "any.only": "Address type must be one of home, work, or other",
  }),
  house_number: Joi.string().optional(),
  street: Joi.string().optional(),
  landmark: Joi.string().optional(),
  city: Joi.string().required().messages({
    "string.empty": "City is required",
  }),
  state: Joi.string().required().messages({
    "string.empty": "State is required",
  }),
  pincode: Joi.string().required().messages({
    "string.empty": "Pincode is required",
  }),
  country: Joi.string().optional(),
  location: Joi.object({
    lat: Joi.number().required().messages({
      "number.base": "Latitude must be a number",
    }),
    lng: Joi.number().required().messages({
      "number.base": "Longitude must be a number",
    }),
  }),
  is_default: Joi.boolean().optional(),
});

const editAddressSchema = Joi.object({
  addressId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid vehicle request ID format",
    "any.required": "Vehicle request ID is required",
  }),
  address_type: Joi.string().valid("home", "work", "other").optional(),
  house_number: Joi.string().optional(),
  street: Joi.string().optional(),
  landmark: Joi.string().optional(),
  city: Joi.string().required().optional(),
  state: Joi.string().required().optional(),
  pincode: Joi.string().required().optional(),
  country: Joi.string().optional(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required(),
  }).optional(),
});

const getOrDeleteCustomerAddress = Joi.object({
  addressId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid address ID format",
    "any.required": "address id is required",
  }),
});

// add to card validation
const addToCartSchema = Joi.object({
  productId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid product ID format",
    "any.required": "product ID is required",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Quantity is required",
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
  }),
  type: Joi.string().valid("medicine", "test").required().messages({
    "any.required": "Type is required",
    "any.only": "Type must be either 'medicine' or 'test'",
  }),
});

const changeQuantitySchema = Joi.object({
  itemId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid item ID format",
    "any.required": "item ID is required",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Quantity is required",
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
  }),
  type: Joi.string().valid("medicine", "test").required().messages({
    "any.required": "Type is required",
    "any.only": "Type must be either 'medicine' or 'test'",
  }),
});

const removeItemFromCartSchema = Joi.object({
  itemId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid item ID format",
    "any.required": "item ID is required",
  }),
  type: Joi.string().valid("medicine", "test").required().messages({
    "any.required": "Type is required",
    "any.only": "Type must be either 'medicine' or 'test'",
  }),
})

const emergencyVehicleRequestSchema = Joi.object({
  patient_name: Joi.string().required().messages({
    'any.required': 'Patient name is required',
  }),
  patient_phone: Joi.string().length(10).pattern(/^\d+$/).required().messages({
    'any.required': 'Patient phone is required',
    'string.length': 'Patient phone must be exactly 10 digits',
    'string.pattern.base': 'Patient phone must contain only digits',
  }),
  emergency_type: Joi.string().required().messages({
    'any.required': 'Emergency type is required',
  }),
  location: Joi.object({
    lat: Joi.number().required().messages({
      'any.required': 'Latitude (lat) is required in location',
    }),
    lng: Joi.number().required().messages({
      'any.required': 'Longitude (lng) is required in location',
    }),
  }).required().messages({
    'any.required': 'Location is required and must be an object with lat and lng',
  }),
  address: Joi.string().required().messages({
    'any.required': 'Address is required',
  }),
  destination_hospital: Joi.string().allow(null, '').messages({
    'string.base': 'Destination hospital must be a string',
  }),
  vehicle_type: Joi.string().required().messages({
    'any.required': 'Vehicle type is required',
  }),
});


// 

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

module.exports = {
  validate,
  validateQuery,
  createPharmacy,
  getAndDeletePharmacyById,
  getAllPharmacy,
  updatePharmacy,
  changeStatusPharmacyValidation,
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
  getAllSpecialOfferValidation,
  getAllFeatureProductValidation,
  getAllSellingProductValidation,
  getCustomerByIdValidation,
  getAllApiValidation,
  getTestdeleteAndById,
  createTestValidation,
  updateTestValidation,
  searchTestValidation,

  loginValidation,
  forgetPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateAdminProfileValidation,
  createBestSelling,
  UpdateAndDeleteBestSelling,
  createDoctorProfileValidation,
  getAllApiValidation,
  getAllDoctoreProfile,
  getDoctoreByIdAndChangeStatusValidation,
  createMedicineValidation,
  updateMedicineValidation,
  getMedicineByIdValidation,
  deleteMedicineValidation,
  searchMedicineValidation,
  approveRejectDeliveryPartnerValidation,
  createDoctorLeadValidation,
  getAllDoctoreLeadValidation,
  getAnddeleteDoctoreLeadByIdValidation,
  updateDoctorLeadValidation,
  createDoctorCategoryValidation,
  getAndDeleteDoctorCategoryByIdValidation,
  updateDoctorCategoryValidation,
  getAllDoctorCategoryValidation,
  createFeaturedProductValidation,
  getAndDeleteFeatureProductIdValidation,
  getAllFeaturedProductsValidation,
  updateFeaturedProductStatusValidation,
  getAllInsuranceLeadsValidation,
  getInsuranceByIdValidation,
  archiveInsuranceByIdValidation,
  createSpecialOfferValidation,
  getAllSpecialOffersValidation,
  updateSpecialOfferValidation,
  specialOfferIdQueryValidation,
  activeDeactiveSpecialOfferValidation,
  createTestCategory,
  updateTestCategory,
  getOrDeleteTestCategory,
  removeTestFromCategory,
  getAllTestCatgValidation,
  getAllVehicleRequestsValidation,
  getVehicleRequestByIdValidation,
  updateVehicleRequestValidation,
  archiveVehicleRequestValidation,
  setDeliveryRateValidation,
  rateIdValidation,
  editRateValidation,
  initiateRefundValidation,
  registerCustomerSchema,
  CustomerverifyOtpSchema,
  loginCustomerSchema,
  forgetPasswordCustomerValidation,
  resetPasswordCustomerValidation,
  signUpSignInWithGoogleValidation,
  addAddressValidation,
  editAddressSchema,
  getOrDeleteCustomerAddress,
  addToCartSchema,
  changeQuantitySchema,
  removeItemFromCartSchema,
  applyInsuranceSchema,
  emergencyVehicleRequestSchema
};
