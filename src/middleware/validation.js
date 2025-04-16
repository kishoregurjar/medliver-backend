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
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
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
  
    phone: Joi.string().optional().messages({
      "string.empty": "Phone number cannot be empty",
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
    updatePharmacy

}